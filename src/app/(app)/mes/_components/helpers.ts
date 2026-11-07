import { formatBRL, formatPercentBp } from "@/lib/money";
import { splitWeights } from "@/lib/calc/split";
import type { InvestMode, SplitRule } from "@/lib/calc";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function getMonthName(month: string): string {
  const parts = month.split("-");
  const m = Number(parts[1]);
  return MONTH_NAMES[m - 1] ?? "";
}

export function getMonthHeading(month: string): string {
  const name = getMonthName(month);
  return `Fechamento de ${name}`;
}

export function formatInvestHint(
  mode: InvestMode,
  value: number,
  totalIncomeCents: number,
  monthName: string,
): string {
  if (totalIncomeCents <= 0) {
    return mode === "percentual"
      ? `R$ 0,00 da renda de ${monthName}.`
      : `0,0% da renda de ${monthName}.`;
  }

  if (mode === "percentual") {
    const calcCents = Math.round((totalIncomeCents * value) / 10_000);
    return `${formatBRL(calcCents)} da renda de ${monthName}.`;
  }

  const bp = Math.round((value / totalIncomeCents) * 10_000);
  return `${formatPercentBp(bp)} da renda de ${monthName}.`;
}

export interface SplitMemberInput {
  id: string;
  participatesInSplit: boolean;
  salaryCents: number;
  customPercent: number | null;
}

export function computeMemberPercentages(
  rule: SplitRule,
  members: SplitMemberInput[],
): Map<string, string> {
  const map = new Map<string, string>();
  const calcMembers = members.map((m) => ({
    id: m.id,
    participatesInSplit: m.participatesInSplit,
    salaryCents: m.salaryCents,
    customPercentBp: m.customPercent,
  }));

  const weights = splitWeights(rule, calcMembers);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  members.forEach((m, idx) => {
    if (!m.participatesInSplit) {
      map.set(m.id, "—");
      return;
    }

    if (totalWeight === 0) {
      map.set(m.id, "0,0%");
      return;
    }

    const weight = weights[idx] ?? 0;
    const bp = Math.round((weight / totalWeight) * 10_000);
    map.set(m.id, formatPercentBp(bp));
  });

  return map;
}

export function formatSettlementCaption(args: {
  members: Array<{ id: string; displayName: string; paidCents: number }>;
  settlements: Array<{ fromMemberId: string; toMemberId: string; cents: number }>;
}): string {
  const { members, settlements } = args;

  const nameMap = new Map<string, string>();
  members.forEach((m) => nameMap.set(m.id, m.displayName));

  let paidText: string;
  const payingMembers = members.filter((m) => m.paidCents > 0);
  const p0 = payingMembers[0];
  const p1 = payingMembers[1];

  if (payingMembers.length === 0 || !p0) {
    paidText = "Nenhuma despesa da família foi paga ainda este mês.";
  } else if (payingMembers.length === 1 || !p1) {
    paidText = `Até agora: ${p0.displayName} pagou ${formatBRL(p0.paidCents)} das despesas da família.`;
  } else if (payingMembers.length === 2) {
    paidText = `Até agora: ${p0.displayName} pagou ${formatBRL(p0.paidCents)} e ${p1.displayName} ${formatBRL(p1.paidCents)} das despesas da família.`;
  } else {
    const parts = payingMembers.map((m) => `${m.displayName} pagou ${formatBRL(m.paidCents)}`);
    paidText = `Até agora: ${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]} das despesas da família.`;
  }

  if (settlements.length === 0) {
    return `${paidText} Nenhum acerto pendente entre vocês.`;
  }

  const settlementTexts = settlements.map((s) => {
    const fromName = nameMap.get(s.fromMemberId) || "Alguém";
    const toName = nameMap.get(s.toMemberId) || "alguém";
    return `${fromName} deve ${formatBRL(s.cents)} a ${toName}`;
  });

  return `${paidText} Pelo que já foi pago, ${settlementTexts.join("; ")}.`;
}
