"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  expenses,
  familyMembers,
  memberIncomes,
  monthlyPeriods,
  recurringExpenses,
} from "@/db/schema";
import { type CalcMember, customPercentsValid } from "@/lib/calc";
import { assertMonthOpen, toMonthDate } from "@/lib/period";
import { requireRole } from "@/lib/session";
import {
  monthParamSchema,
  type SaveMonthCloseInput,
  saveMonthCloseSchema,
} from "@/lib/validators/mes";

function getDaysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/**
 * Salva os dados de fechamento do mês (rendas por membro, investimento e regra de divisão).
 * Restrito a admin/dono. Bloqueado se o mês estiver fechado.
 */
export async function saveMonthClose(
  input: SaveMonthCloseInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = saveMonthCloseSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }
    const data = parsed.data;
    const monthDate = toMonthDate(data.month);

    // Valida se o mês não está fechado para edição
    await assertMonthOpen(sessionMember.familyId, data.month);

    // Se a regra for personalizada, percentuais dos membros ativos participantes devem somar 100%
    if (data.splitRule === "personalizada") {
      const activeMembers = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, sessionMember.familyId),
            ne(familyMembers.status, "removido"),
          ),
        );

      const calcMembers: CalcMember[] = activeMembers.map((m) => ({
        id: m.id,
        salaryCents: 0,
        participatesInSplit: m.participatesInSplit,
        customPercentBp: m.customPercent ?? undefined,
      }));

      if (!customPercentsValid(calcMembers)) {
        return {
          ok: false,
          error: "A soma dos percentuais personalizados deve ser exatamente 100%.",
        };
      }
    }

    // Persistência em transação
    await db.transaction(async (tx) => {
      const [existingPeriod] = await tx
        .select()
        .from(monthlyPeriods)
        .where(
          and(
            eq(monthlyPeriods.familyId, sessionMember.familyId),
            eq(monthlyPeriods.month, monthDate),
          ),
        )
        .limit(1);

      let periodId: string;
      if (existingPeriod) {
        periodId = existingPeriod.id;
        await tx
          .update(monthlyPeriods)
          .set({
            investMode: data.investMode,
            investValue: data.investValue,
            investDestination: data.investDestination,
            splitRule: data.splitRule,
            updatedAt: new Date(),
          })
          .where(eq(monthlyPeriods.id, periodId));
      } else {
        const [inserted] = await tx
          .insert(monthlyPeriods)
          .values({
            familyId: sessionMember.familyId,
            month: monthDate,
            investMode: data.investMode,
            investValue: data.investValue,
            investDestination: data.investDestination,
            splitRule: data.splitRule,
          })
          .returning({ id: monthlyPeriods.id });

        if (!inserted) {
          throw new Error("Falha ao criar período mensal.");
        }
        periodId = inserted.id;
      }

      // Upsert das rendas dos membros
      for (const inc of data.incomes) {
        const [existingInc] = await tx
          .select({ id: memberIncomes.id })
          .from(memberIncomes)
          .where(
            and(
              eq(memberIncomes.periodId, periodId),
              eq(memberIncomes.memberId, inc.memberId),
            ),
          )
          .limit(1);

        if (existingInc) {
          await tx
            .update(memberIncomes)
            .set({
              salaryCents: inc.salaryCents,
              extraCents: inc.extraCents,
              updatedAt: new Date(),
            })
            .where(eq(memberIncomes.id, existingInc.id));
        } else {
          await tx.insert(memberIncomes).values({
            familyId: sessionMember.familyId,
            periodId,
            memberId: inc.memberId,
            salaryCents: inc.salaryCents,
            extraCents: inc.extraCents,
          });
        }
      }
    });

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao salvar fechamento." };
  }
}

/**
 * Copia as despesas recorrentes ativas para o mês (idempotente)
 * e gera as parcelas futuras que caem nele (idempotente).
 * Restrito a admin/dono. Bloqueado se o mês estiver fechado.
 */
export async function copyRecurring(
  month: string,
): Promise<{ ok: true; copiedRecurring: number; generatedInstallments: number } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = monthParamSchema.safeParse({ month });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Mês inválido." };
    }
    const monthDate = toMonthDate(parsed.data.month);

    await assertMonthOpen(sessionMember.familyId, parsed.data.month);

    const [y, m] = monthDate.split("-").map(Number) as [number, number];
    const daysInCurrentMonth = getDaysInMonth(y, m);

    let copiedRecurring = 0;
    let generatedInstallments = 0;

    await db.transaction(async (tx) => {
      // 1. Despesas recorrentes ativas
      const activeRecurring = await tx
        .select()
        .from(recurringExpenses)
        .where(
          and(
            eq(recurringExpenses.familyId, sessionMember.familyId),
            eq(recurringExpenses.active, true),
          ),
        );

      const alreadyCopied = await tx
        .select({ recurringId: expenses.recurringId })
        .from(expenses)
        .where(
          and(
            eq(expenses.familyId, sessionMember.familyId),
            eq(expenses.referenceMonth, monthDate),
            isNull(expenses.deletedAt),
          ),
        );

      const alreadyCopiedSet = new Set(
        alreadyCopied.map((e) => e.recurringId).filter((id): id is string => id !== null),
      );

      for (const rec of activeRecurring) {
        if (!alreadyCopiedSet.has(rec.id)) {
          const dueDay = Math.min(rec.dueDay, daysInCurrentMonth);
          const dueDate = `${y}-${String(m).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

          await tx.insert(expenses).values({
            familyId: sessionMember.familyId,
            referenceMonth: monthDate,
            description: rec.description,
            amountCents: rec.amountCents,
            categoryId: rec.categoryId,
            ownerMemberId: rec.ownerMemberId,
            createdByMemberId: sessionMember.member.id,
            paymentMethodId: rec.paymentMethodId,
            dueDate,
            status: "pendente",
            recurringId: rec.id,
          });

          alreadyCopiedSet.add(rec.id);
          copiedRecurring++;
        }
      }

      // 2. Parcelas futuras que caem neste mês
      const familyInstallmentExpenses = await tx
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.familyId, sessionMember.familyId),
            isNull(expenses.deletedAt),
          ),
        );

      // Agrupa por installmentGroupId
      const groups = new Map<string, typeof familyInstallmentExpenses>();
      for (const exp of familyInstallmentExpenses) {
        if (exp.installmentGroupId && exp.installmentTotal && exp.installmentTotal > 1) {
          const list = groups.get(exp.installmentGroupId) || [];
          list.push(exp);
          groups.set(exp.installmentGroupId, list);
        }
      }

      for (const [, list] of groups) {
        const alreadyHasThisMonth = list.some((e) => e.referenceMonth === monthDate);
        if (alreadyHasThisMonth) continue;

        // Pega a primeira parcela ou a de menor número como base
        const base = [...list].sort(
          (a, b) => (a.installmentNumber ?? 1) - (b.installmentNumber ?? 1),
        )[0];

        if (!base || !base.installmentTotal || !base.installmentNumber) continue;

        const [by, bm, bd] = base.dueDate.split("-").map(Number) as [number, number, number];
        const monthDiff = (y - by) * 12 + (m - bm);
        const targetNumber = base.installmentNumber + monthDiff;

        if (targetNumber >= 1 && targetNumber <= base.installmentTotal) {
          const dueDay = Math.min(bd, daysInCurrentMonth);
          const dueDate = `${y}-${String(m).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;

          await tx.insert(expenses).values({
            familyId: sessionMember.familyId,
            referenceMonth: monthDate,
            description: base.description,
            amountCents: base.amountCents,
            categoryId: base.categoryId,
            ownerMemberId: base.ownerMemberId,
            createdByMemberId: sessionMember.member.id,
            paymentMethodId: base.paymentMethodId,
            dueDate,
            status: "pendente",
            installmentGroupId: base.installmentGroupId,
            installmentNumber: targetNumber,
            installmentTotal: base.installmentTotal,
            notes: base.notes,
          });

          generatedInstallments++;
        }
      }
    });

    return { ok: true, copiedRecurring, generatedInstallments };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao copiar recorrentes." };
  }
}

/**
 * Fecha o mês, tornando-o somente leitura para edição de despesas e fechamento.
 * Restrito a admin/dono.
 */
export async function closeMonth(
  month: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = monthParamSchema.safeParse({ month });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Mês inválido." };
    }
    const monthDate = toMonthDate(parsed.data.month);

    const [existing] = await db
      .select({ id: monthlyPeriods.id })
      .from(monthlyPeriods)
      .where(
        and(
          eq(monthlyPeriods.familyId, sessionMember.familyId),
          eq(monthlyPeriods.month, monthDate),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(monthlyPeriods)
        .set({
          closedAt: new Date(),
          closedBy: sessionMember.member.id,
          updatedAt: new Date(),
        })
        .where(eq(monthlyPeriods.id, existing.id));
    } else {
      await db.insert(monthlyPeriods).values({
        familyId: sessionMember.familyId,
        month: monthDate,
        closedAt: new Date(),
        closedBy: sessionMember.member.id,
      });
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao fechar mês." };
  }
}

/**
 * Reabre um mês fechado, permitindo edições novamente.
 * Restrito a admin/dono.
 */
export async function reopenMonth(
  month: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = monthParamSchema.safeParse({ month });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Mês inválido." };
    }
    const monthDate = toMonthDate(parsed.data.month);

    await db
      .update(monthlyPeriods)
      .set({
        closedAt: null,
        closedBy: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(monthlyPeriods.familyId, sessionMember.familyId),
          eq(monthlyPeriods.month, monthDate),
        ),
      );

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao reabrir mês." };
  }
}
