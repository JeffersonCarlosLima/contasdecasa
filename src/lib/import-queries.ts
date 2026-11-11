import "server-only";

import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { currentMonth } from "@/lib/dates";
import { toMonthKey } from "@/lib/period";
import {
  categories,
  expenses,
  familyMembers,
  importBatches,
  importMappings,
  importRows,
  importRules,
  paymentMethods,
} from "@/db/schema";
import type { MappingConfig } from "@/lib/import/types";

export interface ImportBatchListItem {
  id: string;
  layout: string;
  filename: string;
  fileSize: number;
  rowCount: number;
  status: "rascunho" | "confirmado" | "desfeito";
  paymentMethod: { id: string; name: string };
  ownerMember: { id: string; displayName: string; color: string } | null;
  importedBy: { id: string; displayName: string };
  confirmedAt: Date | null;
  undoneAt: Date | null;
  createdAt: Date;
  /** Competência escolhida no envio ("YYYY-MM-01"); nulo em lotes antigos. */
  referenceMonth: string | null;
}

export interface ImportRowReviewItem {
  id: string;
  lineNo: number;
  date: string;
  descriptionOriginal: string;
  descriptionNormalized: string;
  amountCents: number;
  type: "despesa" | "receita" | "salario" | "ignorar";
  ignoreReason: string | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  ownerMemberId: string | null;
  ownerMember: { id: string; displayName: string; color: string } | null;
  paymentMethodId: string | null;
  paymentMethod: { id: string; name: string } | null;
  selected: boolean;
  fingerprint: string;
  situation: "nova" | "duplicada" | "possivel_vinculo";
  matchedExpenseId: string | null;
  matchedExpense: { id: string; description: string; amountCents: number; dueDate: string } | null;
  linkedExpenseId: string | null;
  linkedRowId: string | null;
  createdExpenseId: string | null;
  targetMemberIncomeId: string | null;
  appliedExtraCents: number | null;
  previousSalaryCents: number | null;
}

export interface BatchReviewSummary {
  count: number;
  selected: number;
  expensesCents: number;
  incomesCents: number;
  duplicatesCount: number;
  ignoredCount: number;
  missingCategoryCount: number;
  missingOwnerCount: number;
  readyToConfirm: boolean;
}

export interface BatchReviewData {
  batch: ImportBatchListItem;
  rows: ImportRowReviewItem[];
  summary: BatchReviewSummary;
}

export interface ImportRuleItem {
  id: string;
  matchType: "contem" | "comeca";
  pattern: string;
  priority: number;
  categoryId: string;
  ownerMemberId?: string | null;
  paymentMethodId?: string | null;
  category: { id: string; name: string; color: string };
  ownerMember: { id: string; displayName: string; color: string } | null;
  paymentMethod: { id: string; name: string } | null;
  createdAt: Date;
}

export interface ImportMappingItem {
  id: string;
  name: string;
  config: MappingConfig;
  createdAt: Date;
}

export async function listBatches(familyId: string): Promise<ImportBatchListItem[]> {
  const importedByMember = alias(familyMembers, "imported_by_member");
  const ownerMember = alias(familyMembers, "owner_member");

  const rows = await db
    .select({
      batch: importBatches,
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      },
      owner: {
        id: ownerMember.id,
        displayName: ownerMember.displayName,
        color: ownerMember.color,
      },
      importedBy: {
        id: importedByMember.id,
        displayName: importedByMember.displayName,
      },
    })
    .from(importBatches)
    .innerJoin(paymentMethods, eq(importBatches.paymentMethodId, paymentMethods.id))
    .innerJoin(importedByMember, eq(importBatches.importedBy, importedByMember.id))
    .leftJoin(ownerMember, eq(importBatches.ownerMemberId, ownerMember.id))
    .where(eq(importBatches.familyId, familyId))
    .orderBy(desc(importBatches.createdAt));

  return rows.map((r) => ({
    id: r.batch.id,
    layout: r.batch.layout,
    filename: r.batch.filename,
    fileSize: r.batch.fileSize,
    rowCount: r.batch.rowCount,
    status: r.batch.status,
    paymentMethod: r.paymentMethod,
    ownerMember:
      r.owner && r.owner.id
        ? {
            id: r.owner.id,
            displayName: r.owner.displayName ?? "",
            color: r.owner.color ?? "chart-1",
          }
        : null,
    importedBy: r.importedBy,
    confirmedAt: r.batch.confirmedAt,
    undoneAt: r.batch.undoneAt,
    createdAt: r.batch.createdAt,
    referenceMonth: r.batch.referenceMonth,
  }));
}

export async function getBatchReview(
  familyId: string,
  batchId: string,
): Promise<BatchReviewData | null> {
  const importedByMember = alias(familyMembers, "imported_by_member");
  const batchOwnerMember = alias(familyMembers, "batch_owner_member");

  const [batchRow] = await db
    .select({
      batch: importBatches,
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      },
      owner: {
        id: batchOwnerMember.id,
        displayName: batchOwnerMember.displayName,
        color: batchOwnerMember.color,
      },
      importedBy: {
        id: importedByMember.id,
        displayName: importedByMember.displayName,
      },
    })
    .from(importBatches)
    .innerJoin(paymentMethods, eq(importBatches.paymentMethodId, paymentMethods.id))
    .innerJoin(importedByMember, eq(importBatches.importedBy, importedByMember.id))
    .leftJoin(batchOwnerMember, eq(importBatches.ownerMemberId, batchOwnerMember.id))
    .where(and(eq(importBatches.id, batchId), eq(importBatches.familyId, familyId)))
    .limit(1);

  if (!batchRow) {
    return null;
  }

  const batch: ImportBatchListItem = {
    id: batchRow.batch.id,
    layout: batchRow.batch.layout,
    filename: batchRow.batch.filename,
    fileSize: batchRow.batch.fileSize,
    rowCount: batchRow.batch.rowCount,
    status: batchRow.batch.status,
    paymentMethod: batchRow.paymentMethod,
    ownerMember:
      batchRow.owner && batchRow.owner.id
        ? {
            id: batchRow.owner.id,
            displayName: batchRow.owner.displayName ?? "",
            color: batchRow.owner.color ?? "chart-1",
          }
        : null,
    importedBy: batchRow.importedBy,
    confirmedAt: batchRow.batch.confirmedAt,
    undoneAt: batchRow.batch.undoneAt,
    createdAt: batchRow.batch.createdAt,
    referenceMonth: batchRow.batch.referenceMonth,
  };

  const rowOwnerMember = alias(familyMembers, "row_owner_member");
  const rowPaymentMethod = alias(paymentMethods, "row_payment_method");
  const matchedExp = alias(expenses, "matched_expense");

  const dbRows = await db
    .select({
      row: importRows,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
      owner: {
        id: rowOwnerMember.id,
        displayName: rowOwnerMember.displayName,
        color: rowOwnerMember.color,
      },
      paymentMethod: {
        id: rowPaymentMethod.id,
        name: rowPaymentMethod.name,
      },
      matchedExpense: {
        id: matchedExp.id,
        description: matchedExp.description,
        amountCents: matchedExp.amountCents,
        dueDate: matchedExp.dueDate,
      },
    })
    .from(importRows)
    .leftJoin(categories, eq(importRows.categoryId, categories.id))
    .leftJoin(rowOwnerMember, eq(importRows.ownerMemberId, rowOwnerMember.id))
    .leftJoin(rowPaymentMethod, eq(importRows.paymentMethodId, rowPaymentMethod.id))
    .leftJoin(matchedExp, eq(importRows.matchedExpenseId, matchedExp.id))
    .where(and(eq(importRows.batchId, batchId), eq(importRows.familyId, familyId)))
    .orderBy(importRows.lineNo);

  const rows: ImportRowReviewItem[] = dbRows.map((r) => ({
    id: r.row.id,
    lineNo: r.row.lineNo,
    date: r.row.date,
    descriptionOriginal: r.row.descriptionOriginal,
    descriptionNormalized: r.row.descriptionNormalized,
    amountCents: r.row.amountCents,
    type: r.row.type,
    ignoreReason: r.row.ignoreReason,
    categoryId: r.row.categoryId,
    category:
      r.category && r.category.id
        ? {
            id: r.category.id,
            name: r.category.name ?? "",
            color: r.category.color ?? "chart-1",
          }
        : null,
    ownerMemberId: r.row.ownerMemberId,
    ownerMember:
      r.owner && r.owner.id
        ? {
            id: r.owner.id,
            displayName: r.owner.displayName ?? "",
            color: r.owner.color ?? "chart-1",
          }
        : null,
    paymentMethodId: r.row.paymentMethodId,
    paymentMethod:
      r.paymentMethod && r.paymentMethod.id
        ? {
            id: r.paymentMethod.id,
            name: r.paymentMethod.name ?? "",
          }
        : null,
    selected: r.row.selected,
    fingerprint: r.row.fingerprint,
    situation: r.row.situation,
    matchedExpenseId: r.row.matchedExpenseId,
    matchedExpense:
      r.matchedExpense && r.matchedExpense.id
        ? {
            id: r.matchedExpense.id,
            description: r.matchedExpense.description ?? "",
            amountCents: r.matchedExpense.amountCents ?? 0,
            dueDate: r.matchedExpense.dueDate ?? "",
          }
        : null,
    linkedExpenseId: r.row.linkedExpenseId,
    linkedRowId: r.row.linkedRowId,
    createdExpenseId: r.row.createdExpenseId,
    targetMemberIncomeId: r.row.targetMemberIncomeId,
    appliedExtraCents: r.row.appliedExtraCents,
    previousSalaryCents: r.row.previousSalaryCents,
  }));

  let selectedCount = 0;
  let expensesCents = 0;
  let incomesCents = 0;
  let duplicatesCount = 0;
  let ignoredCount = 0;
  let missingCategoryCount = 0;
  let missingOwnerCount = 0;

  for (const r of rows) {
    if (r.situation === "duplicada") duplicatesCount++;
    if (r.type === "ignorar" || !r.selected) ignoredCount++;

    // Linha com tipo 'ignorar' NUNCA vira despesa nem receita, mesmo se marcada
    if (r.selected && r.type !== "ignorar") {
      selectedCount++;
      const abs = Math.abs(r.amountCents);
      if (r.type === "despesa") {
        expensesCents += abs;
        if (!r.categoryId) missingCategoryCount++;
      } else if (r.type === "receita" || r.type === "salario") {
        incomesCents += abs;
        if (!r.ownerMemberId) missingOwnerCount++;
      }
    }
  }

  const readyToConfirm =
    selectedCount > 0 && missingCategoryCount === 0 && missingOwnerCount === 0;

  const summary: BatchReviewSummary = {
    count: rows.length,
    selected: selectedCount,
    expensesCents,
    incomesCents,
    duplicatesCount,
    ignoredCount,
    missingCategoryCount,
    missingOwnerCount,
    readyToConfirm,
  };

  return {
    batch,
    rows,
    summary,
  };
}

export async function listRules(familyId: string): Promise<ImportRuleItem[]> {
  const ruleOwnerMember = alias(familyMembers, "rule_owner_member");

  const rows = await db
    .select({
      rule: importRules,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
      owner: {
        id: ruleOwnerMember.id,
        displayName: ruleOwnerMember.displayName,
        color: ruleOwnerMember.color,
      },
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      },
    })
    .from(importRules)
    .innerJoin(categories, eq(importRules.categoryId, categories.id))
    .leftJoin(ruleOwnerMember, eq(importRules.ownerMemberId, ruleOwnerMember.id))
    .leftJoin(paymentMethods, eq(importRules.paymentMethodId, paymentMethods.id))
    .where(eq(importRules.familyId, familyId))
    .orderBy(desc(importRules.priority), desc(importRules.createdAt));

  return rows.map((r) => ({
    id: r.rule.id,
    matchType: r.rule.matchType,
    pattern: r.rule.pattern,
    priority: r.rule.priority,
    categoryId: r.rule.categoryId,
    ownerMemberId: r.rule.ownerMemberId,
    paymentMethodId: r.rule.paymentMethodId,
    category: r.category,
    ownerMember:
      r.owner && r.owner.id
        ? {
            id: r.owner.id,
            displayName: r.owner.displayName ?? "",
            color: r.owner.color ?? "chart-1",
          }
        : null,
    paymentMethod:
      r.paymentMethod && r.paymentMethod.id
        ? {
            id: r.paymentMethod.id,
            name: r.paymentMethod.name ?? "",
          }
        : null,
    createdAt: r.rule.createdAt,
  }));
}

export async function listMappings(familyId: string): Promise<ImportMappingItem[]> {
  const rows = await db
    .select()
    .from(importMappings)
    .where(eq(importMappings.familyId, familyId))
    .orderBy(importMappings.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    config: r.config as MappingConfig,
    createdAt: r.createdAt,
  }));
}

export interface BatchSummary {
  batchId: string;
  expensesByMonth: { month: string; count: number }[];
  linkedCount: number;
  incomesCount: number;
  incomeMonths: string[];
  duplicatesCount?: number;
}

/**
 * Retorna os fingerprints de linhas de receita e salário pertencentes
 * a lotes CONFIRMADOS (não desfeitos) da mesma família.
 * Usado para deduplicação de receitas na análise (upload) e na confirmação.
 */
export async function getConfirmedIncomeFingerprints(
  familyId: string,
  candidateFingerprints?: string[],
  executor: typeof db = db,
): Promise<Set<string>> {
  if (candidateFingerprints && candidateFingerprints.length === 0) {
    return new Set();
  }

  const conditions = [
    eq(importRows.familyId, familyId),
    eq(importBatches.familyId, familyId),
    eq(importBatches.status, "confirmado"),
    inArray(importRows.type, ["receita", "salario"]),
    isNotNull(importRows.fingerprint),
  ];

  if (candidateFingerprints && candidateFingerprints.length > 0) {
    conditions.push(inArray(importRows.fingerprint, candidateFingerprints));
  }

  const rows = await executor
    .select({ fingerprint: importRows.fingerprint })
    .from(importRows)
    .innerJoin(importBatches, eq(importBatches.id, importRows.batchId))
    .where(and(...conditions));

  return new Set(
    rows
      .map((r) => r.fingerprint)
      .filter((fp): fp is string => typeof fp === "string" && fp.length > 0),
  );
}

/**
 * Resumo do lote importado para avisos pós-confirmação e redirecionamento.
 * Sempre filtra por family_id e ignora despesas excluídas logicamente (deleted_at).
 */
export async function getBatchSummary(
  familyId: string,
  batchId: string,
  /** Competência do lote ("YYYY-MM-01"); quando informada, as receitas contam nesse mês. */
  batchReferenceMonth?: string | null,
): Promise<BatchSummary> {
  const createdExpenses = await db
    .select({ referenceMonth: expenses.referenceMonth })
    .from(expenses)
    .where(
      and(
        eq(expenses.familyId, familyId),
        eq(expenses.importBatchId, batchId),
        isNull(expenses.deletedAt),
      ),
    );

  const batchMonthKey = batchReferenceMonth ? toMonthKey(batchReferenceMonth) : null;

  const monthCounts = new Map<string, number>();
  for (const exp of createdExpenses) {
    const m = toMonthKey(exp.referenceMonth);
    monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }

  const expensesByMonth = Array.from(monthCounts.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const rows = await db
    .select({
      id: importRows.id,
      date: importRows.date,
      type: importRows.type,
      situation: importRows.situation,
      selected: importRows.selected,
      linkedExpenseId: importRows.linkedExpenseId,
      createdExpenseId: importRows.createdExpenseId,
      targetMemberIncomeId: importRows.targetMemberIncomeId,
    })
    .from(importRows)
    .where(
      and(
        eq(importRows.familyId, familyId),
        eq(importRows.batchId, batchId),
      ),
    )
    .orderBy(importRows.lineNo);

  let linkedCount = 0;
  let incomesCount = 0;
  let duplicatesCount = 0;
  const incomeMonthsSet = new Set<string>();

  for (const r of rows) {
    if (r.situation === "duplicada") {
      duplicatesCount += 1;
    }
    if (r.type === "despesa" && r.linkedExpenseId && (r.createdExpenseId || r.selected)) {
      linkedCount += 1;
    }
    if (
      (r.type === "receita" || r.type === "salario") &&
      r.situation !== "duplicada" &&
      (r.targetMemberIncomeId || r.selected)
    ) {
      incomesCount += 1;
      incomeMonthsSet.add(batchMonthKey ?? r.date.slice(0, 7));
    }
  }

  const incomeMonths = Array.from(incomeMonthsSet);

  return {
    batchId,
    expensesByMonth,
    linkedCount,
    incomesCount,
    incomeMonths,
    duplicatesCount,
  };
}

/**
 * Calcula o mês alvo (YYYY-MM) após confirmar a importação:
 * 1. O mês com mais despesas criadas (empate: o mais antigo)
 * 2. Sem despesas criadas: mês da primeira receita
 * 3. Fallback: mês corrente
 */
export function computeTargetMonth(summary: BatchSummary): string {
  if (summary.expensesByMonth.length > 0) {
    const sorted = [...summary.expensesByMonth].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.month.localeCompare(b.month);
    });
    const top = sorted[0];
    if (top) {
      return top.month;
    }
  }
  const firstIncome = summary.incomeMonths[0];
  if (firstIncome) {
    return firstIncome;
  }
  return currentMonth();
}

