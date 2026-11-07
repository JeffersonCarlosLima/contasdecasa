"use server";

import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  expenses,
  familyMembers,
  importBatches,
  importMappings,
  importRows,
  importRules,
  memberIncomes,
  monthlyPeriods,
  paymentMethods,
} from "@/db/schema";
import { cardInvoice } from "@/lib/card-invoice";
import { todayISO } from "@/lib/dates";
import {
  applyRules,
  findOwnTransfers,
  fingerprint,
  matchStatus,
  normalizeDescription,
  parseCsv,
  suggestType,
  type SameDayExpenseCandidate,
  type TransferRowCandidate,
} from "@/lib/import";
import { computeTargetMonth, getBatchSummary } from "@/lib/import-queries";
import { assertMonthOpen, toMonthDate, toMonthKey } from "@/lib/period";
import { requireMember, requireRole } from "@/lib/session";
import {
  batchIdSchema,
  createRuleFromRowSchema,
  type CreateRuleFromRowInput,
  rowIdSchema,
  ruleIdSchema,
  saveMappingSchema,
  type SaveMappingInput,
  saveRuleSchema,
  type SaveRuleInput,
  setRowLinkSchema,
  type SetRowLinkInput,
  updateRowsSchema,
  type UpdateRowsInput,
} from "@/lib/validators/import";

/* ==========================================================================
 * Rate Limiter em memória (por usuário, máx. 10 uploads em 10 min)
 * ========================================================================== */

const uploadRateLimitMap = new Map<string, number[]>();

export async function checkUploadRateLimit(
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxUploads = 10;

  const timestamps = uploadRateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxUploads) {
    return {
      allowed: false,
      reason:
        "Limite de uploads atingido (máx. 10 arquivos a cada 10 minutos). Tente novamente mais tarde.",
    };
  }

  recent.push(now);
  uploadRateLimitMap.set(userId, recent);
  return { allowed: true };
}

/* ==========================================================================
 * 1. Upload do Extrato CSV
 * ========================================================================== */

export type UploadStatementResult =
  | { ok: true; batchId: string }
  | { ok: false; needsMapping: true; headers: string[]; sample: string[][] }
  | { ok: false; error: string };

export async function uploadStatement(formData: FormData): Promise<UploadStatementResult> {
  try {
    const sessionMember = await requireMember();

    // Rate limit por usuário
    const rateCheck = await checkUploadRateLimit(sessionMember.user.id);
    if (!rateCheck.allowed) {
      return { ok: false, error: rateCheck.reason! };
    }

    const file = formData.get("file");
    const paymentMethodId = formData.get("paymentMethodId");
    const ownerMemberIdRaw = formData.get("ownerMemberId");
    const mappingId = formData.get("mappingId");

    if (!file || !(file instanceof File)) {
      return { ok: false, error: "Arquivo CSV não fornecido." };
    }

    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      return { ok: false, error: "Forma de pagamento é obrigatória." };
    }

    // Validação de tamanho: máx 5 MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        ok: false,
        error: "Arquivo muito grande. O tamanho máximo permitido é 5 MB.",
      };
    }

    // Permissão: membro comum só pode importar para si mesmo
    const ownerMemberId =
      ownerMemberIdRaw === "familia" || !ownerMemberIdRaw
        ? null
        : String(ownerMemberIdRaw);

    const isSelf = ownerMemberId !== null && ownerMemberId === sessionMember.member.id;
    if (!isSelf && sessionMember.role !== "admin" && sessionMember.role !== "dono") {
      return {
        ok: false,
        error: "Apenas administradores podem importar para a Família ou outros membros.",
      };
    }

    // Validação do meio de pagamento pertencer à família, estar ativo e ser do tipo cartão ou conta
    const [pm] = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        archived: paymentMethods.archived,
        closingDay: paymentMethods.closingDay,
        dueDay: paymentMethods.dueDay,
      })
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!pm) {
      return { ok: false, error: "Forma de pagamento não encontrada nesta família." };
    }

    if (pm.archived) {
      return {
        ok: false,
        error: "A forma de pagamento selecionada está arquivada.",
      };
    }

    if (pm.type !== "cartao" && pm.type !== "conta") {
      return {
        ok: false,
        error: "Apenas formas de pagamento do tipo cartão ou conta podem ser importadas.",
      };
    }

    const isCardWithInvoice =
      pm.type === "cartao" &&
      typeof pm.closingDay === "number" &&
      typeof pm.dueDay === "number";

    // shortcut: limpeza oportunista de rascunhos com mais de 30 dias, trocar por timer se o volume crescer
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db
      .delete(importBatches)
      .where(
        and(
          eq(importBatches.status, "rascunho"),
          lt(importBatches.createdAt, thirtyDaysAgo),
        ),
      )
      .catch(() => null);

    // Carrega mapeamento se fornecido
    let customMappingConfig = undefined;
    if (mappingId && typeof mappingId === "string") {
      const [customMapping] = await db
        .select()
        .from(importMappings)
        .where(
          and(
            eq(importMappings.id, mappingId),
            eq(importMappings.familyId, sessionMember.familyId),
          ),
        )
        .limit(1);

      if (customMapping) {
        customMappingConfig = customMapping.config as unknown as import("@/lib/import").MappingConfig;
      }
    }

    // Leitura do arquivo em memória
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Parse do CSV via lib/import
    const parseResult = parseCsv(buffer, customMappingConfig);

    if (parseResult.layout === "desconhecido") {
      return {
        ok: false,
        needsMapping: true,
        headers: parseResult.headers ?? [],
        sample: parseResult.sample ?? [],
      };
    }

    if (parseResult.rows.length === 0) {
      return {
        ok: false,
        error: "Nenhum lançamento válido encontrado no arquivo CSV.",
      };
    }

    // Limite de 5.000 linhas
    if (parseResult.rows.length > 5000) {
      return {
        ok: false,
        error: "Arquivo excede o limite máximo de 5.000 linhas.",
      };
    }

    // Carrega dados de contexto para classificação e deduplicação
    const rules = await db
      .select()
      .from(importRules)
      .where(eq(importRules.familyId, sessionMember.familyId))
      .orderBy(desc(importRules.priority));

    const familyMemberRows = await db
      .select({ id: familyMembers.id, displayName: familyMembers.displayName })
      .from(familyMembers)
      .where(eq(familyMembers.familyId, sessionMember.familyId));

    const memberNames = familyMemberRows.map((m) => m.displayName);

    // Fingerprints já existentes na família (despesas ativas)
    const existingExpenseFps = await db
      .select({ fingerprint: expenses.fingerprint })
      .from(expenses)
      .where(
        and(
          eq(expenses.familyId, sessionMember.familyId),
          isNull(expenses.deletedAt),
          isNotNull(expenses.fingerprint),
        ),
      );

    const existingFingerprints = new Set(
      existingExpenseFps.map((e) => e.fingerprint!).filter(Boolean),
    );

    // Despesas pendentes para sugestão de vínculo
    const pendingExpenses = await db
      .select({
        id: expenses.id,
        amountCents: expenses.amountCents,
        month: expenses.referenceMonth,
        dueDate: expenses.dueDate,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.familyId, sessionMember.familyId),
          eq(expenses.status, "pendente"),
          isNull(expenses.deletedAt),
        ),
      );

    // Determina intervalo de datas do lote para busca de despesas do mesmo dia
    const batchDates = parseResult.rows
      .map((r) => r.date)
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .sort();

    const minBatchDate = batchDates[0];
    const maxBatchDate = batchDates[batchDates.length - 1];

    const sameDayCandidates: SameDayExpenseCandidate[] = [];

    if (minBatchDate && maxBatchDate) {
      // Expandimos 1 dia antes e 1 dia depois para cobrir o fuso America/Araguaina (UTC-3)
      const minPaidAt = new Date(`${minBatchDate}T00:00:00Z`);
      minPaidAt.setUTCDate(minPaidAt.getUTCDate() - 1);
      const maxPaidAt = new Date(`${maxBatchDate}T23:59:59Z`);
      maxPaidAt.setUTCDate(maxPaidAt.getUTCDate() + 1);

      // Janela de busca: se for cartão com fechamento/vencimento, expande até o maior vencimento calculado
      let minQueryDueDate = minBatchDate;
      let maxQueryDueDate = maxBatchDate;

      if (isCardWithInvoice) {
        const calculatedDueDates = parseResult.rows
          .filter((r) => typeof r.date === "string" && r.date.length >= 10)
          .map(
            (r) =>
              cardInvoice({
                purchaseDate: r.date,
                closingDay: pm.closingDay!,
                dueDay: pm.dueDay!,
              }).dueDate,
          )
          .sort();

        if (calculatedDueDates.length > 0) {
          const minCalc = calculatedDueDates[0];
          const maxCalc = calculatedDueDates[calculatedDueDates.length - 1];
          if (minCalc && minCalc < minQueryDueDate) minQueryDueDate = minCalc;
          if (maxCalc && maxCalc > maxQueryDueDate) maxQueryDueDate = maxCalc;
        }
      }

      const candidateExpenses = await db
        .select({
          id: expenses.id,
          amountCents: expenses.amountCents,
          dueDate: expenses.dueDate,
          paidAt: expenses.paidAt,
          paymentMethodId: expenses.paymentMethodId,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.familyId, sessionMember.familyId),
            eq(expenses.paymentMethodId, paymentMethodId),
            isNull(expenses.deletedAt),
            or(
              and(
                gte(expenses.dueDate, minQueryDueDate),
                lte(expenses.dueDate, maxQueryDueDate),
              ),
              and(
                isNotNull(expenses.paidAt),
                gte(expenses.paidAt, minPaidAt),
                lte(expenses.paidAt, maxPaidAt),
              ),
            ),
          ),
        );

      for (const exp of candidateExpenses) {
        if (exp.dueDate) {
          sameDayCandidates.push({
            id: exp.id,
            amountCents: exp.amountCents,
            date: exp.dueDate,
            paymentMethodId: exp.paymentMethodId,
          });
        }
        if (exp.paidAt) {
          const paidDate = todayISO(exp.paidAt);
          if (paidDate !== exp.dueDate) {
            sameDayCandidates.push({
              id: exp.id,
              amountCents: exp.amountCents,
              date: paidDate,
              paymentMethodId: exp.paymentMethodId,
            });
          }
        }
      }
    }

    // Preparação das linhas processadas
    interface PreRow {
      lineNo: number;
      date: string;
      descriptionOriginal: string;
      descriptionNormalized: string;
      amountCents: number;
      type: "despesa" | "receita" | "salario" | "ignorar";
      ignoreReason: string | null;
      categoryId: string | null;
      ownerMemberId: string | null;
      paymentMethodId: string | null;
      selected: boolean;
      fingerprint: string;
      situation: "nova" | "duplicada" | "possivel_vinculo";
      matchedExpenseId: string | null;
      tempId: string;
    }

    const preRows: PreRow[] = parseResult.rows.map((row) => {
      const descNorm = row.descriptionNormalized || normalizeDescription(row.descriptionOriginal);

      const fp = fingerprint({
        familyId: sessionMember.familyId,
        paymentMethodId,
        date: row.date,
        amountCents: row.amountCents,
        descriptionNormalized: descNorm,
        externalId: row.externalId,
      });

      const typeSugg = suggestType(row);
      const ruleApplied = applyRules(row, rules);

      const type = typeSugg.type;
      const ignoreReason = typeSugg.ignoreReason ?? null;
      const categoryId = ruleApplied?.categoryId ?? null;
      const finalOwner = ruleApplied?.ownerId !== undefined ? ruleApplied.ownerId : ownerMemberId;
      const finalPm = ruleApplied?.paymentMethodId ?? paymentMethodId;

      const rowInvoice = isCardWithInvoice
        ? cardInvoice({
            purchaseDate: row.date,
            closingDay: pm.closingDay!,
            dueDay: pm.dueDay!,
          })
        : null;

      const rowForMatch = rowInvoice
        ? {
            ...row,
            date: rowInvoice.dueDate,
          }
        : row;

      const matched = matchStatus(rowForMatch, {
        existingFingerprints,
        pendingExpenses,
        sameDayExpenses: sameDayCandidates,
        paymentMethodId: finalPm,
        rowFingerprint: fp,
      });

      const isDuplicated = matched.situation === "duplicada";
      const isIgnored = type === "ignorar";
      const selected = !isDuplicated && !isIgnored;

      return {
        lineNo: row.lineNo,
        date: row.date,
        descriptionOriginal: row.descriptionOriginal,
        descriptionNormalized: descNorm,
        amountCents: row.amountCents,
        type,
        ignoreReason,
        categoryId,
        ownerMemberId: finalOwner,
        paymentMethodId: finalPm,
        selected,
        fingerprint: fp,
        situation: matched.situation,
        matchedExpenseId: matched.matchedExpenseId ?? null,
        tempId: crypto.randomUUID(),
      };
    });

    // Detecção de transferências entre contas próprias
    const transferCandidates: TransferRowCandidate[] = preRows.map((r) => ({
      id: r.tempId,
      paymentMethodId: r.paymentMethodId,
      date: r.date,
      amountCents: r.amountCents,
      descriptionNormalized: r.descriptionNormalized,
    }));

    const transferPairs = findOwnTransfers(transferCandidates, memberNames);
    const transferMap = new Map<string, string>();
    for (const [idA, idB] of transferPairs) {
      transferMap.set(idA, idB);
      transferMap.set(idB, idA);
    }

    // Aplica transferência para pares identificados
    for (const r of preRows) {
      if (transferMap.has(r.tempId)) {
        r.type = "ignorar";
        r.ignoreReason = "Transferência entre contas próprias";
        r.selected = false;
      }
    }

    // Gravação transacional do lote e de suas linhas
    const batchId = await db.transaction(async (tx) => {
      const [batch] = await tx
        .insert(importBatches)
        .values({
          familyId: sessionMember.familyId,
          paymentMethodId,
          ownerMemberId,
          layout: parseResult.layout,
          filename: file.name,
          fileSize: file.size,
          rowCount: preRows.length,
          status: "rascunho",
          importedBy: sessionMember.member.id,
        })
        .returning({ id: importBatches.id });

      if (!batch) {
        throw new Error("Falha ao criar lote de importação.");
      }

      // Mapeia tempId para id real inserido para vincular transferências
      const insertedRows = await tx
        .insert(importRows)
        .values(
          preRows.map((r) => ({
            batchId: batch.id,
            familyId: sessionMember.familyId,
            lineNo: r.lineNo,
            date: r.date,
            descriptionOriginal: r.descriptionOriginal,
            descriptionNormalized: r.descriptionNormalized,
            amountCents: r.amountCents,
            type: r.type,
            ignoreReason: r.ignoreReason,
            categoryId: r.categoryId,
            ownerMemberId: r.ownerMemberId,
            paymentMethodId: r.paymentMethodId,
            selected: r.selected,
            fingerprint: r.fingerprint,
            situation: r.situation,
            matchedExpenseId: r.matchedExpenseId,
          })),
        )
        .returning({ id: importRows.id, lineNo: importRows.lineNo });

      const lineToRealId = new Map(insertedRows.map((ir) => [ir.lineNo, ir.id]));
      const tempIdToLine = new Map(preRows.map((pr) => [pr.tempId, pr.lineNo]));

      // Vincula linkedRowId para as transferências detectadas
      for (const [idA, idB] of transferPairs) {
        const lineA = tempIdToLine.get(idA);
        const lineB = tempIdToLine.get(idB);
        if (lineA && lineB) {
          const realIdA = lineToRealId.get(lineA);
          const realIdB = lineToRealId.get(lineB);
          if (realIdA && realIdB) {
            await tx
              .update(importRows)
              .set({ linkedRowId: realIdB })
              .where(eq(importRows.id, realIdA));
            await tx
              .update(importRows)
              .set({ linkedRowId: realIdA })
              .where(eq(importRows.id, realIdB));
          }
        }
      }

      return batch.id;
    });

    return { ok: true, batchId };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro inesperado ao importar extrato.",
    };
  }
}

/* ==========================================================================
 * 2. Salvar Mapeamento Personalizado
 * ========================================================================== */

export async function saveMapping(
  input: SaveMappingInput,
): Promise<{ ok: true; mappingId: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const parsed = saveMappingSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const [mapping] = await db
      .insert(importMappings)
      .values({
        familyId: sessionMember.familyId,
        name: parsed.data.name,
        config: parsed.data.config,
      })
      .returning({ id: importMappings.id });

    if (!mapping) {
      return { ok: false, error: "Falha ao salvar mapeamento." };
    }

    return { ok: true, mappingId: mapping.id };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar mapeamento.",
    };
  }
}

/* ==========================================================================
 * 3. Atualizar Linhas em Lote (Revisão)
 * ========================================================================== */

export async function updateRows(
  input: UpdateRowsInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const parsed = updateRowsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const { batchId, rowIds, patch } = parsed.data;

    const [batch] = await db
      .select({ status: importBatches.status })
      .from(importBatches)
      .where(
        and(
          eq(importBatches.id, batchId),
          eq(importBatches.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batch) {
      return { ok: false, error: "Lote não encontrado." };
    }
    if (batch.status !== "rascunho") {
      return { ok: false, error: "Apenas lotes em rascunho podem ser editados." };
    }

    const updateSet: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (patch.type !== undefined) updateSet.type = patch.type;
    if (patch.categoryId !== undefined) updateSet.categoryId = patch.categoryId;
    if (patch.ownerId !== undefined) updateSet.ownerMemberId = patch.ownerId;
    if (patch.selected !== undefined) updateSet.selected = patch.selected;

    await db
      .update(importRows)
      .set(updateSet)
      .where(
        and(
          eq(importRows.batchId, batchId),
          eq(importRows.familyId, sessionMember.familyId),
          inArray(importRows.id, rowIds),
        ),
      );

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar linhas.",
    };
  }
}

/* ==========================================================================
 * 4. Vincular Linha a Despesa Pendente
 * ========================================================================== */

export async function setRowLink(
  input: SetRowLinkInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const parsed = setRowLinkSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const { batchId, rowId, expenseId } = parsed.data;

    const [batch] = await db
      .select({ status: importBatches.status })
      .from(importBatches)
      .where(
        and(
          eq(importBatches.id, batchId),
          eq(importBatches.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batch || batch.status !== "rascunho") {
      return { ok: false, error: "Lote inválido ou já finalizado." };
    }

    await db
      .update(importRows)
      .set({
        linkedExpenseId: expenseId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(importRows.id, rowId),
          eq(importRows.batchId, batchId),
          eq(importRows.familyId, sessionMember.familyId),
        ),
      );

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao vincular despesa.",
    };
  }
}

/* ==========================================================================
 * 5. Desfazer Sugestão de Transferência
 * ========================================================================== */

export async function clearTransferSuggestion(
  batchId: string,
  rowId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const bId = batchIdSchema.parse(batchId);
    const rId = rowIdSchema.parse(rowId);

    const [batch] = await db
      .select({ status: importBatches.status })
      .from(importBatches)
      .where(
        and(
          eq(importBatches.id, bId),
          eq(importBatches.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batch || batch.status !== "rascunho") {
      return { ok: false, error: "Lote inválido ou já finalizado." };
    }

    const [row] = await db
      .select()
      .from(importRows)
      .where(
        and(
          eq(importRows.id, rId),
          eq(importRows.batchId, bId),
          eq(importRows.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!row) {
      return { ok: false, error: "Linha não encontrada." };
    }

    const partnerId = row.linkedRowId;

    await db.transaction(async (tx) => {
      await tx
        .update(importRows)
        .set({
          linkedRowId: null,
          type: row.amountCents < 0 ? "despesa" : "receita",
          ignoreReason: null,
          selected: true,
          updatedAt: new Date(),
        })
        .where(eq(importRows.id, row.id));

      if (partnerId) {
        const [partnerRow] = await tx
          .select({ amountCents: importRows.amountCents })
          .from(importRows)
          .where(eq(importRows.id, partnerId))
          .limit(1);

        if (partnerRow) {
          await tx
            .update(importRows)
            .set({
              linkedRowId: null,
              type: partnerRow.amountCents < 0 ? "despesa" : "receita",
              ignoreReason: null,
              selected: true,
              updatedAt: new Date(),
            })
            .where(eq(importRows.id, partnerId));
        }
      }
    });

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao desfazer transferência.",
    };
  }
}

/* ==========================================================================
 * 6. Criar Regra de Classificação a partir de Linha
 * ========================================================================== */

export async function createRuleFromRow(
  input: CreateRuleFromRowInput,
): Promise<{ ok: true; ruleId: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = createRuleFromRowSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const [rule] = await db
      .insert(importRules)
      .values({
        familyId: sessionMember.familyId,
        matchType: parsed.data.matchType,
        pattern: parsed.data.pattern,
        categoryId: parsed.data.categoryId,
        ownerMemberId: parsed.data.ownerId ?? null,
        paymentMethodId: parsed.data.paymentMethodId ?? null,
        priority: 0,
      })
      .returning({ id: importRules.id });

    if (!rule) {
      return { ok: false, error: "Falha ao criar regra." };
    }

    return { ok: true, ruleId: rule.id };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao criar regra de classificação.",
    };
  }
}

/* ==========================================================================
 * 7. Salvar e Excluir Regras (Admin / Dono)
 * ========================================================================== */

export async function saveRule(
  input: SaveRuleInput,
): Promise<{ ok: true; ruleId: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = saveRuleSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const data = parsed.data;

    if (data.id) {
      const [updated] = await db
        .update(importRules)
        .set({
          matchType: data.matchType,
          pattern: data.pattern,
          categoryId: data.categoryId,
          ownerMemberId: data.ownerMemberId ?? null,
          paymentMethodId: data.paymentMethodId ?? null,
          priority: data.priority,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(importRules.id, data.id),
            eq(importRules.familyId, sessionMember.familyId),
          ),
        )
        .returning({ id: importRules.id });

      if (!updated) {
        return { ok: false, error: "Regra não encontrada." };
      }
      return { ok: true, ruleId: updated.id };
    }

    const [created] = await db
      .insert(importRules)
      .values({
        familyId: sessionMember.familyId,
        matchType: data.matchType,
        pattern: data.pattern,
        categoryId: data.categoryId,
        ownerMemberId: data.ownerMemberId ?? null,
        paymentMethodId: data.paymentMethodId ?? null,
        priority: data.priority,
      })
      .returning({ id: importRules.id });

    if (!created) {
      return { ok: false, error: "Falha ao criar regra." };
    }
    return { ok: true, ruleId: created.id };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar regra.",
    };
  }
}

export async function deleteRule(
  ruleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const rId = ruleIdSchema.parse(ruleId);

    const [deleted] = await db
      .delete(importRules)
      .where(
        and(
          eq(importRules.id, rId),
          eq(importRules.familyId, sessionMember.familyId),
        ),
      )
      .returning({ id: importRules.id });

    if (!deleted) {
      return { ok: false, error: "Regra não encontrada." };
    }

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao excluir regra.",
    };
  }
}

/* ==========================================================================
 * 8. Confirmar Lote de Importação (Transacional e Idempotente)
 * ========================================================================== */

export async function confirmBatch(
  batchId: string,
): Promise<{ ok: true; batchId: string; targetMonth: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const bId = batchIdSchema.parse(batchId);

    const [batch] = await db
      .select()
      .from(importBatches)
      .where(
        and(
          eq(importBatches.id, bId),
          eq(importBatches.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batch) {
      return { ok: false, error: "Lote de importação não encontrado." };
    }

    // Idempotência
    if (batch.status === "confirmado") {
      const summary = await getBatchSummary(sessionMember.familyId, batch.id);
      return { ok: true, batchId: batch.id, targetMonth: computeTargetMonth(summary) };
    }
    if (batch.status === "desfeito") {
      return {
        ok: false,
        error: "Este lote já foi desfeito e não pode ser confirmado novamente.",
      };
    }

    const selectedRows = await db
      .select()
      .from(importRows)
      .where(
        and(
          eq(importRows.batchId, bId),
          eq(importRows.familyId, sessionMember.familyId),
          eq(importRows.selected, true),
        ),
      )
      .orderBy(importRows.lineNo);

    if (selectedRows.length === 0) {
      return { ok: false, error: "Nenhum lançamento selecionado para confirmação." };
    }

    // Carrega forma de pagamento do lote para verificar regra de fatura de cartão e status
    const [batchPaymentMethod] = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        archived: paymentMethods.archived,
        closingDay: paymentMethods.closingDay,
        dueDay: paymentMethods.dueDay,
      })
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, batch.paymentMethodId),
          eq(paymentMethods.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batchPaymentMethod || batchPaymentMethod.archived) {
      return {
        ok: false,
        error: !batchPaymentMethod
          ? "Forma de pagamento não encontrada nesta família."
          : "A forma de pagamento deste lote está arquivada e não pode ser confirmada.",
      };
    }

    const isCardWithInvoice =
      batchPaymentMethod?.type === "cartao" &&
      typeof batchPaymentMethod.closingDay === "number" &&
      typeof batchPaymentMethod.dueDay === "number";

    // Validação de categorias e membros
    for (const r of selectedRows) {
      if (r.type === "despesa" && !r.categoryId) {
        return {
          ok: false,
          error: "Todas as despesas selecionadas devem ter uma categoria definida.",
        };
      }
      if ((r.type === "receita" || r.type === "salario") && !r.ownerMemberId) {
        return {
          ok: false,
          error:
            "Receitas e salários devem ser atribuídos a um membro específico da família.",
        };
      }
    }

    // Validação de meses fechados
    const uniqueMonths = Array.from(
      new Set(
        selectedRows.map((r) => {
          if (r.type === "despesa" && !r.linkedExpenseId && isCardWithInvoice) {
            const invoice = cardInvoice({
              purchaseDate: r.date,
              closingDay: batchPaymentMethod.closingDay!,
              dueDay: batchPaymentMethod.dueDay!,
            });
            return toMonthKey(invoice.referenceMonth);
          }
          return toMonthKey(toMonthDate(r.date));
        }),
      ),
    );

    for (const m of uniqueMonths) {
      await assertMonthOpen(sessionMember.familyId, m);
    }

    // Transação de confirmação
    await db.transaction(async (tx) => {
      for (const r of selectedRows) {
        const rowMonthDate = toMonthDate(r.date);
        const absAmount = Math.abs(r.amountCents);

        if (r.type === "despesa") {
          if (r.linkedExpenseId) {
            // Vincula a despesa pendente existente e marca como paga
            await tx
              .update(expenses)
              .set({
                status: "pago",
                paidAt: new Date(`${r.date}T12:00:00Z`),
                paidByMemberId: r.ownerMemberId || sessionMember.member.id,
                importBatchId: batch.id,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(expenses.id, r.linkedExpenseId),
                  eq(expenses.familyId, sessionMember.familyId),
                ),
              );

            await tx
              .update(importRows)
              .set({ createdExpenseId: r.linkedExpenseId })
              .where(eq(importRows.id, r.id));
          } else {
            // Cria nova despesa (com regra de fatura se for cartão com fechamento e vencimento)
            let expenseReferenceMonth = rowMonthDate;
            let expenseDueDate = r.date;

            if (isCardWithInvoice) {
              const invoice = cardInvoice({
                purchaseDate: r.date,
                closingDay: batchPaymentMethod.closingDay!,
                dueDay: batchPaymentMethod.dueDay!,
              });
              expenseReferenceMonth = invoice.referenceMonth;
              expenseDueDate = invoice.dueDate;
            }

            const [newExp] = await tx
              .insert(expenses)
              .values({
                familyId: sessionMember.familyId,
                referenceMonth: expenseReferenceMonth,
                description: r.descriptionOriginal,
                amountCents: absAmount,
                categoryId: r.categoryId!,
                ownerMemberId: r.ownerMemberId,
                createdByMemberId: sessionMember.member.id,
                paymentMethodId: batch.paymentMethodId,
                dueDate: expenseDueDate,
                status: "pago",
                paidAt: new Date(`${r.date}T12:00:00Z`),
                paidByMemberId: r.ownerMemberId || sessionMember.member.id,
                importBatchId: batch.id,
                fingerprint: r.fingerprint,
              })
              .returning({ id: expenses.id });

            if (newExp) {
              await tx
                .update(importRows)
                .set({ createdExpenseId: newExp.id })
                .where(eq(importRows.id, r.id));
            }
          }
        } else if (r.type === "receita" || r.type === "salario") {
          // Garante período do mês
          let [period] = await tx
            .select({ id: monthlyPeriods.id })
            .from(monthlyPeriods)
            .where(
              and(
                eq(monthlyPeriods.familyId, sessionMember.familyId),
                eq(monthlyPeriods.month, rowMonthDate),
              ),
            )
            .limit(1);

          if (!period) {
            [period] = await tx
              .insert(monthlyPeriods)
              .values({
                familyId: sessionMember.familyId,
                month: rowMonthDate,
              })
              .returning({ id: monthlyPeriods.id });
          }

          if (!period) {
            throw new Error(`Falha ao inicializar período do mês ${rowMonthDate}`);
          }

          // Busca ou inicializa renda do membro no período
          let [income] = await tx
            .select()
            .from(memberIncomes)
            .where(
              and(
                eq(memberIncomes.familyId, sessionMember.familyId),
                eq(memberIncomes.periodId, period.id),
                eq(memberIncomes.memberId, r.ownerMemberId!),
              ),
            )
            .limit(1);

          if (!income) {
            [income] = await tx
              .insert(memberIncomes)
              .values({
                familyId: sessionMember.familyId,
                periodId: period.id,
                memberId: r.ownerMemberId!,
                salaryCents: 0,
                extraCents: 0,
              })
              .returning();
          }

          if (!income) {
            throw new Error("Falha ao registrar renda do membro.");
          }

          if (r.type === "receita") {
            const newExtra = income.extraCents + absAmount;
            await tx
              .update(memberIncomes)
              .set({
                extraCents: newExtra,
                updatedAt: new Date(),
              })
              .where(eq(memberIncomes.id, income.id));

            await tx
              .update(importRows)
              .set({
                appliedExtraCents: absAmount,
                targetMemberIncomeId: income.id,
              })
              .where(eq(importRows.id, r.id));
          } else if (r.type === "salario") {
            const prevSalary = income.salaryCents;
            await tx
              .update(memberIncomes)
              .set({
                salaryCents: absAmount,
                updatedAt: new Date(),
              })
              .where(eq(memberIncomes.id, income.id));

            await tx
              .update(importRows)
              .set({
                previousSalaryCents: prevSalary,
                targetMemberIncomeId: income.id,
              })
              .where(eq(importRows.id, r.id));
          }
        }
      }

      // Marca o lote como confirmado
      await tx
        .update(importBatches)
        .set({
          status: "confirmado",
          confirmedAt: new Date(),
          confirmedBy: sessionMember.member.id,
          updatedAt: new Date(),
        })
        .where(eq(importBatches.id, batch.id));
    });

    const summary = await getBatchSummary(sessionMember.familyId, batch.id);
    const targetMonth = computeTargetMonth(summary);

    return { ok: true, batchId: batch.id, targetMonth };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao confirmar lote de importação.",
    };
  }
}

/* ==========================================================================
 * 9. Desfazer Lote de Importação
 * ========================================================================== */

export async function undoBatch(
  batchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireMember();
    const bId = batchIdSchema.parse(batchId);

    const [batch] = await db
      .select()
      .from(importBatches)
      .where(
        and(
          eq(importBatches.id, bId),
          eq(importBatches.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!batch) {
      return { ok: false, error: "Lote não encontrado." };
    }

    // Permissão: quem importou, dono ou admin
    const canUndo =
      batch.importedBy === sessionMember.member.id ||
      sessionMember.role === "admin" ||
      sessionMember.role === "dono";

    if (!canUndo) {
      return {
        ok: false,
        error: "Apenas quem importou o lote ou administradores podem desfazê-lo.",
      };
    }

    if (batch.status !== "confirmado") {
      return {
        ok: false,
        error: "Apenas lotes confirmados podem ser desfeitos.",
      };
    }

    const rows = await db
      .select()
      .from(importRows)
      .where(
        and(
          eq(importRows.batchId, bId),
          eq(importRows.familyId, sessionMember.familyId),
        ),
      );

    // Validação de meses fechados:
    // Lê DIRETAMENTE o referenceMonth gravado nas despesas criadas ou vinculadas ao lote.
    // NÃO recalcula cardInvoice nem consulta a forma de pagamento, garantindo que mesmo se
    // o dia de fechamento ou vencimento do cartão for alterado após a importação, o desfazer
    // respeitará com fidelidade total o mês gravado nas despesas da época.
    const createdExpenses = await db
      .select({ referenceMonth: expenses.referenceMonth })
      .from(expenses)
      .where(
        and(
          eq(expenses.importBatchId, batch.id),
          eq(expenses.familyId, sessionMember.familyId),
          isNull(expenses.deletedAt),
        ),
      );

    const linkedIds = rows
      .map((r) => r.linkedExpenseId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const linkedExpenses =
      linkedIds.length > 0
        ? await db
            .select({ referenceMonth: expenses.referenceMonth })
            .from(expenses)
            .where(
              and(
                inArray(expenses.id, linkedIds),
                eq(expenses.familyId, sessionMember.familyId),
                isNull(expenses.deletedAt),
              ),
            )
        : [];

    const monthsToCheck = new Set<string>([
      ...createdExpenses.map((e) => toMonthKey(e.referenceMonth)),
      ...linkedExpenses.map((e) => toMonthKey(e.referenceMonth)),
      ...rows
        .filter((r) => r.type === "receita" || r.type === "salario")
        .map((r) => toMonthKey(toMonthDate(r.date))),
    ]);

    if (monthsToCheck.size === 0) {
      for (const r of rows) {
        monthsToCheck.add(toMonthKey(toMonthDate(r.date)));
      }
    }

    for (const m of monthsToCheck) {
      await assertMonthOpen(sessionMember.familyId, m);
    }

    // Transação de reversão
    await db.transaction(async (tx) => {
      // 1. Exclusão lógica das despesas criadas pelo lote
      await tx
        .update(expenses)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(expenses.importBatchId, batch.id),
            eq(expenses.familyId, sessionMember.familyId),
            isNull(expenses.deletedAt),
          ),
        );

      // 2. Reversão de vínculos com despesas pré-existentes
      for (const r of rows) {
        if (r.linkedExpenseId) {
          await tx
            .update(expenses)
            .set({
              status: "pendente",
              paidAt: null,
              paidByMemberId: null,
              importBatchId: null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(expenses.id, r.linkedExpenseId),
                eq(expenses.familyId, sessionMember.familyId),
              ),
            );
        }

        // 3. Reversão de receitas aplicadas
        if (r.targetMemberIncomeId && r.appliedExtraCents) {
          const [currentInc] = await tx
            .select({ extraCents: memberIncomes.extraCents })
            .from(memberIncomes)
            .where(eq(memberIncomes.id, r.targetMemberIncomeId))
            .limit(1);

          if (currentInc) {
            const restoredExtra = Math.max(0, currentInc.extraCents - r.appliedExtraCents);
            await tx
              .update(memberIncomes)
              .set({ extraCents: restoredExtra, updatedAt: new Date() })
              .where(eq(memberIncomes.id, r.targetMemberIncomeId));
          }
        }

        // 4. Reversão de salário aplicado
        if (r.targetMemberIncomeId && r.previousSalaryCents !== null) {
          await tx
            .update(memberIncomes)
            .set({
              salaryCents: r.previousSalaryCents,
              updatedAt: new Date(),
            })
            .where(eq(memberIncomes.id, r.targetMemberIncomeId));
        }
      }

      // 5. Marca o lote como desfeito
      await tx
        .update(importBatches)
        .set({
          status: "desfeito",
          undoneAt: new Date(),
          undoneBy: sessionMember.member.id,
          updatedAt: new Date(),
        })
        .where(eq(importBatches.id, batch.id));
    });

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao desfazer lote de importação.",
    };
  }
}
