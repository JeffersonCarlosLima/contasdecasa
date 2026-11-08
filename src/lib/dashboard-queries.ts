import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import type { PersonColor } from "@/components/ui/MemberAvatar";
import type { SplitRule } from "@/lib/calc/types";
import { monthLabel } from "@/lib/dates";
import {
  type ExpenseItem,
  listExpenses,
} from "@/lib/expense-queries";
import { formatBRL } from "@/lib/money";
import { toMonthDate, toMonthKey } from "@/lib/period";
import { getMonthClose } from "@/lib/period-queries";

export interface DashboardMember {
  id: string;
  displayName: string;
  color: string;
}

export interface DashboardKPIs {
  incomeCents: number;
  investmentCents: number;
  availableCents: number;
  spentCents: number;
  leftoverCents: number;
}

export interface DashboardBudget {
  investedCents: number;
  paidCents: number;
  pendingCents: number;
  freeCents?: number;
}

export interface DashboardByPersonItem {
  owner: {
    id: string;
    displayName: string;
    color: string;
  } | null;
  totalCents: number;
}

export interface DashboardByCategoryItem {
  category: {
    id: string;
    name: string;
    color: string;
    monthlyLimitCents: number | null;
  };
  totalCents: number;
}

export interface DashboardSplitMember {
  id: string;
  name: string;
  color: PersonColor;
  totalCents: number;
  ownCents: number;
  familyShareCents: number;
  paidCents: number;
  inSplit: boolean;
}

export interface DashboardSplit {
  members: DashboardSplitMember[];
  ruleText: string;
  settlementText?: string | null;
}

export interface DashboardData {
  monthLabel: string;
  members: DashboardMember[];
  kpis: DashboardKPIs;
  budget: DashboardBudget;
  byPerson: DashboardByPersonItem[];
  byCategory: DashboardByCategoryItem[];
  totalSpentCents: number;
  split: DashboardSplit;
  splitRule: SplitRule | string;
  upcoming: ExpenseItem[];
  empty: boolean;
  hasIncome: boolean;
  closed?: boolean;
}

export function formatSplitRuleText(
  rule: "igual" | "proporcional" | "personalizada",
  familyTotalCents: number,
  participants: Array<{ displayName: string }>,
): string {
  const formattedTotal = formatBRL(familyTotalCents);
  const rulePhrases: Record<"igual" | "proporcional" | "personalizada", string> = {
    igual: "dividida em partes iguais",
    proporcional: "dividida proporcional ao salário",
    personalizada: "dividida por percentuais combinados",
  };
  const phrase = rulePhrases[rule] ?? "dividida em partes iguais";

  if (participants.length === 0) {
    return `Despesas próprias + parte das despesas da família (${formattedTotal}).`;
  }

  const names = participants.map((p) => p.displayName);
  let namesText = "";
  if (names.length === 1) {
    namesText = names[0]!;
  } else if (names.length === 2) {
    namesText = `${names[0]} e ${names[1]}`;
  } else {
    namesText = `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
  }

  return `Despesas próprias + parte das despesas da família (${formattedTotal}), ${phrase} entre ${namesText}.`;
}

export function formatSettlementText(
  settlements: Array<{ fromMemberId: string; toMemberId: string; cents: number }>,
  members: Array<{ id: string; displayName: string }>,
): string | null {
  if (settlements.length === 0) return null;
  const nameMap = new Map(members.map((m) => [m.id, m.displayName]));
  const phrases = settlements.map((s) => {
    const from = nameMap.get(s.fromMemberId) ?? "Alguém";
    const to = nameMap.get(s.toMemberId) ?? "alguém";
    return `${from} deve ${formatBRL(s.cents)} a ${to}`;
  });
  return phrases.join("; ");
}

export async function getDashboard(
  familyId: string,
  month: string,
  memberId?: string | null,
): Promise<DashboardData> {
  const monthDate = toMonthDate(month);
  const monthKey = toMonthKey(monthDate);
  const formattedMonthLabel = monthLabel(monthKey);

  // 1. Reutiliza fechamento do mês (rendas, período, regras, divisão e acerto)
  const monthClose = await getMonthClose(familyId, monthKey);

  // 2. Lista membros da família para os chips de seleção
  const members: DashboardMember[] = monthClose.members.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    color: m.color,
  }));

  // 3. Busca despesas gerais da família para o mês
  const allExpenses = await listExpenses(familyId, monthKey);

  // 4. Se houver filtro de membro, busca as despesas específicas dele
  const isMemberFiltered = Boolean(memberId);
  const filteredExpenses = isMemberFiltered
    ? await listExpenses(familyId, monthKey, { memberId })
    : allExpenses;

  const currentExpenses = filteredExpenses.items;
  const currentTotals = filteredExpenses.totals;

  // 5. KPIs e Orçamento (ajustados pelo filtro se aplicável)
  let incomeCents = monthClose.summary.incomeCents;
  let investmentCents = monthClose.summary.investmentCents;
  let availableCents = monthClose.summary.availableCents;
  let spentCents = allExpenses.totals.totalCents;
  let leftoverCents = monthClose.summary.leftoverCents;

  if (isMemberFiltered) {
    if (memberId === "familia") {
      incomeCents = 0;
      investmentCents = 0;
      availableCents = 0;
      spentCents = currentTotals.totalCents;
      leftoverCents = -spentCents;
    } else {
      const selectedMember = monthClose.members.find((m) => m.id === memberId);
      const memberIncome = selectedMember
        ? selectedMember.salaryCents + selectedMember.extraCents
        : 0;
      incomeCents = memberIncome;

      if (monthClose.investMode === "percentual") {
        investmentCents = Math.round((incomeCents * monthClose.investValue) / 10_000);
      } else {
        // Modo valor fixo da família: proporcional à renda deste membro
        const totalFamilyIncome = monthClose.summary.incomeCents;
        investmentCents =
          totalFamilyIncome > 0
            ? Math.round((monthClose.investValue * incomeCents) / totalFamilyIncome)
            : 0;
      }

      availableCents = incomeCents - investmentCents;
      spentCents = currentTotals.totalCents;
      leftoverCents = availableCents - spentCents;
    }
  }

  const paidCents = currentExpenses
    .filter((i) => i.status === "pago")
    .reduce((acc, i) => acc + i.amountCents, 0);

  const pendingCents = currentExpenses
    .filter((i) => i.status !== "pago")
    .reduce((acc, i) => acc + i.amountCents, 0);

  const budget: DashboardBudget = {
    investedCents: investmentCents,
    paidCents,
    pendingCents,
    freeCents: leftoverCents,
  };

  const kpis: DashboardKPIs = {
    incomeCents,
    investmentCents,
    availableCents,
    spentCents,
    leftoverCents,
  };

  // 6. Gastos por pessoa (byPerson)
  // Se filtrado por membro, destaca/filtra o grupo respectivo; se família toda, lista todos
  const byPersonGroups = isMemberFiltered
    ? allExpenses.groups.filter((g) =>
        memberId === "familia" ? g.owner === null : g.owner?.id === memberId,
      )
    : allExpenses.groups;

  const byPerson: DashboardByPersonItem[] = byPersonGroups.map((g) => ({
    owner: g.owner
      ? {
          id: g.owner.id,
          displayName: g.owner.displayName,
          color: g.owner.color,
        }
      : null,
    totalCents: g.subtotalCents,
  }));

  // 7. Gastos por categoria (byCategory) com limits da tabela categories
  const dbCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      monthlyLimitCents: categories.monthlyLimitCents,
    })
    .from(categories)
    .where(eq(categories.familyId, familyId));

  const categoryLimitMap = new Map(dbCategories.map((c) => [c.id, c.monthlyLimitCents]));

  const catMap = new Map<
    string,
    {
      category: {
        id: string;
        name: string;
        color: string;
        monthlyLimitCents: number | null;
      };
      totalCents: number;
    }
  >();

  for (const item of currentExpenses) {
    const catId = item.category.id;
    const existing = catMap.get(catId);
    if (existing) {
      existing.totalCents += item.amountCents;
    } else {
      catMap.set(catId, {
        category: {
          id: catId,
          name: item.category.name,
          color: item.category.color,
          monthlyLimitCents: categoryLimitMap.get(catId) ?? null,
        },
        totalCents: item.amountCents,
      });
    }
  }

  const byCategory = Array.from(catMap.values()).sort((a, b) => b.totalCents - a.totalCents);

  // 8. Divisão e acerto (split)
  const familyExpenses = allExpenses.items.filter((i) => i.owner === null);
  const familyTotalCents = familyExpenses.reduce((acc, i) => acc + i.amountCents, 0);
  const participants = monthClose.members.filter((m) => m.participatesInSplit);

  const ruleText = formatSplitRuleText(monthClose.splitRule, familyTotalCents, participants);
  const settlementText = formatSettlementText(
    monthClose.split.settlements,
    monthClose.members,
  );

  const splitMembers: DashboardSplitMember[] = monthClose.members.map((m) => {
    const splitInfo = monthClose.split.members.find((sm) => sm.memberId === m.id);
    return {
      id: m.id,
      name: m.displayName,
      color: m.color as PersonColor,
      totalCents: splitInfo?.responsibilityCents ?? 0,
      ownCents: splitInfo?.ownCents ?? 0,
      familyShareCents: splitInfo?.familyShareCents ?? 0,
      paidCents: splitInfo?.paidCents ?? 0,
      inSplit: m.participatesInSplit,
    };
  });

  const split: DashboardSplit = {
    members: splitMembers,
    ruleText,
    settlementText,
  };

  // 9. Próximos vencimentos (upcoming: pendentes/atrasadas ordenadas: atrasadas primeiro, depois vencimento)
  const pendingOrLate = currentExpenses.filter(
    (e) => e.status === "atrasado" || e.status === "pendente",
  );

  pendingOrLate.sort((a, b) => {
    if (a.status === "atrasado" && b.status !== "atrasado") return -1;
    if (a.status !== "atrasado" && b.status === "atrasado") return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const upcoming = pendingOrLate.slice(0, 5);

  return {
    monthLabel: formattedMonthLabel,
    members,
    kpis,
    budget,
    byPerson,
    byCategory,
    totalSpentCents: spentCents,
    split,
    splitRule: monthClose.splitRule,
    upcoming,
    empty: allExpenses.items.length === 0,
    hasIncome: monthClose.summary.incomeCents > 0,
    closed: monthClose.closed,
  };
}
