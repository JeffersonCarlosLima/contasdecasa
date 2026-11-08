import "server-only";

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  expenses,
  families,
  familyMembers,
  memberIncomes,
  monthlyPeriods,
  personColor,
  recurringExpenses,
} from "@/db/schema";
import {
  type CalcExpense,
  type CalcMember,
  computeSplit,
  type MonthSummary,
  monthSummary,
  type SplitResult,
} from "@/lib/calc";
import { monthLabel } from "@/lib/dates";
import { toMonthDate, toMonthKey } from "@/lib/period";

export type PersonColor = (typeof personColor.enumValues)[number];

export interface MonthCloseMember {
  id: string;
  displayName: string;
  color: PersonColor;
  kinship: string;
  hasLogin: boolean;
  participatesInSplit: boolean;
  customPercent: number | null;
  salaryCents: number;
  extraCents: number;
}

export interface MonthCloseData {
  month: string;
  closed: boolean;
  investMode: "valor" | "percentual";
  investValue: number;
  investDestination: string | null;
  splitRule: "igual" | "proporcional" | "personalizada";
  members: MonthCloseMember[];
  summary: MonthSummary;
  split: SplitResult;
  recurring: {
    copied: boolean;
    names: string[];
  };
  previousMonthLabel: string;
}

function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const prevDate = new Date(Date.UTC(y, m - 2, 1));
  const py = prevDate.getUTCFullYear();
  const pm = String(prevDate.getUTCMonth() + 1).padStart(2, "0");
  return `${py}-${pm}`;
}

export async function getMonthClose(familyId: string, month: string): Promise<MonthCloseData> {
  const monthDate = toMonthDate(month);
  const monthKey = toMonthKey(monthDate);

  // 1. Regra padrão da família
  const [family] = await db
    .select({ defaultSplitRule: families.defaultSplitRule })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  // 2. Período do mês (sem criar nada se não existir)
  const [period] = await db
    .select()
    .from(monthlyPeriods)
    .where(
      and(
        eq(monthlyPeriods.familyId, familyId),
        eq(monthlyPeriods.month, monthDate),
      ),
    )
    .limit(1);

  // 3. Membros ativos da família
  const dbMembers = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        ne(familyMembers.status, "removido"),
      ),
    )
    .orderBy(familyMembers.createdAt);

  // 4. Rendas salvas no período (se houver período)
  const incomeMap = new Map<string, { salaryCents: number; extraCents: number }>();
  if (period) {
    const periodIncomes = await db
      .select()
      .from(memberIncomes)
      .where(
        and(
          eq(memberIncomes.familyId, familyId),
          eq(memberIncomes.periodId, period.id),
        ),
      );

    for (const inc of periodIncomes) {
      incomeMap.set(inc.memberId, {
        salaryCents: inc.salaryCents,
        extraCents: inc.extraCents,
      });
    }
  }

  // 5. Monta a lista de membros com as rendas
  const members: MonthCloseMember[] = dbMembers.map((m) => {
    const inc = incomeMap.get(m.id);
    return {
      id: m.id,
      displayName: m.displayName,
      color: m.color,
      kinship: m.kinship,
      hasLogin: m.userId !== null,
      participatesInSplit: m.participatesInSplit,
      customPercent: m.customPercent,
      salaryCents: inc?.salaryCents ?? 0,
      extraCents: inc?.extraCents ?? 0,
    };
  });

  // 6. Despesas do mês
  const monthExpenses = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.familyId, familyId),
        eq(expenses.referenceMonth, monthDate),
        isNull(expenses.deletedAt),
      ),
    );

  const investMode = period?.investMode ?? "valor";
  const investValue = period?.investValue ?? 0;
  const splitRule = period?.splitRule ?? family?.defaultSplitRule ?? "igual";

  // 7. Resumo do mês via lib/calc
  const summary = monthSummary({
    incomes: members.map((m) => ({
      salaryCents: m.salaryCents,
      extraCents: m.extraCents,
    })),
    investMode,
    investValue,
    expenseAmounts: monthExpenses.map((e) => e.amountCents),
  });

  // 8. Divisão e acerto via lib/calc (regras de responsabilidade e acerto com despesas pagas)
  const calcMembers: CalcMember[] = members.map((m) => ({
    id: m.id,
    salaryCents: m.salaryCents,
    participatesInSplit: m.participatesInSplit,
    customPercentBp: m.customPercent ?? undefined,
  }));

  const calcExpenses: CalcExpense[] = monthExpenses.map((e) => ({
    amountCents: e.amountCents,
    ownerMemberId: e.ownerMemberId,
    paidByMemberId: e.paidByMemberId,
    status: e.status,
  }));

  const split = computeSplit({
    rule: splitRule,
    members: calcMembers,
    expenses: calcExpenses,
  });

  // 9. Status das despesas recorrentes
  const copiedRecurring = monthExpenses.filter((e) => e.recurringId !== null);
  const copied = copiedRecurring.length > 0;

  let names: string[] = [];
  if (copied) {
    names = Array.from(new Set(copiedRecurring.map((e) => e.description)));
  } else {
    const activeRecurring = await db
      .select({ description: recurringExpenses.description })
      .from(recurringExpenses)
      .where(
        and(
          eq(recurringExpenses.familyId, familyId),
          eq(recurringExpenses.active, true),
        ),
      );
    names = activeRecurring.map((r) => r.description);
  }

  const prevMonthKey = getPreviousMonthKey(monthKey);
  const previousMonthLabel = monthLabel(prevMonthKey);

  return {
    month: monthKey,
    closed: Boolean(period?.closedAt),
    investMode,
    investValue,
    investDestination: period?.investDestination ?? null,
    splitRule,
    members,
    summary,
    split,
    recurring: {
      copied,
      names,
    },
    previousMonthLabel,
  };
}
