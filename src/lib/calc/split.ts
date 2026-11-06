import { allocate } from "./allocate";
import type {
  CalcExpense,
  CalcMember,
  MemberSummary,
  Settlement,
  SplitResult,
  SplitRule,
} from "./types";

/** Pesos de divisão dos participantes (0 para quem não participa). */
export function splitWeights(rule: SplitRule, members: CalcMember[]): number[] {
  const participants = members.map((m) => m.participatesInSplit);
  const weights = members.map((m, i) => {
    if (!participants[i]) return 0;
    if (rule === "igual") return 1;
    if (rule === "proporcional") return Math.max(m.salaryCents, 0);
    return Math.max(m.customPercentBp ?? 0, 0);
  });
  // Sem salários (proporcional) ou sem percentuais (personalizada): cai em partes iguais.
  if (weights.every((w) => w === 0)) return participants.map((p) => (p ? 1 : 0));
  return weights;
}

/** Divide `totalCents` entre os membros pela regra; não participantes recebem 0. */
export function splitAmount(
  totalCents: number,
  rule: SplitRule,
  members: CalcMember[],
): number[] {
  const weights = splitWeights(rule, members);
  if (weights.every((w) => w === 0)) return members.map(() => 0);
  return allocate(totalCents, weights);
}

/** Valida percentuais personalizados: precisam somar 100% (10000 pontos-base) entre participantes. */
export function customPercentsValid(members: CalcMember[]): boolean {
  const total = members
    .filter((m) => m.participatesInSplit)
    .reduce((a, m) => a + (m.customPercentBp ?? 0), 0);
  return total === 10_000;
}

function settle(members: MemberSummary[]): Settlement[] {
  const debtors = members
    .filter((m) => m.balanceCents < 0)
    .map((m) => ({ id: m.memberId, left: -m.balanceCents }))
    .sort((a, b) => b.left - a.left);
  const creditors = members
    .filter((m) => m.balanceCents > 0)
    .map((m) => ({ id: m.memberId, left: m.balanceCents }))
    .sort((a, b) => b.left - a.left);
  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const cents = Math.min(d.left, c.left);
    if (cents > 0) out.push({ fromMemberId: d.id, toMemberId: c.id, cents });
    d.left -= cents;
    c.left -= cents;
    if (d.left === 0) i++;
    if (c.left === 0) j++;
  }
  return out;
}

/**
 * Responsabilidade e acerto entre os membros.
 *
 * - responsabilidade = despesas próprias + parte nas despesas da Família (só participantes);
 * - já pagou = soma das despesas pagas por ele;
 * - saldo/acerto usam apenas despesas já pagas (como no protótipo: "pelo que já foi pago,
 *   Lorrane deve R$ X a Jefferson"), o que mantém a soma dos saldos igual a zero.
 */
export function computeSplit(args: {
  rule: SplitRule;
  members: CalcMember[];
  expenses: CalcExpense[];
}): SplitResult {
  const { rule, members, expenses } = args;
  const index = new Map(members.map((m, i) => [m.id, i]));
  const n = members.length;

  const own = new Array<number>(n).fill(0);
  const paid = new Array<number>(n).fill(0);
  const ownPaid = new Array<number>(n).fill(0);
  let familyTotal = 0;
  let familyPaidTotal = 0;

  for (const e of expenses) {
    const owner = e.ownerMemberId === null ? undefined : index.get(e.ownerMemberId);
    if (e.ownerMemberId === null) {
      familyTotal += e.amountCents;
      if (e.status === "pago") familyPaidTotal += e.amountCents;
    } else if (owner !== undefined) {
      own[owner] = (own[owner] ?? 0) + e.amountCents;
      if (e.status === "pago") ownPaid[owner] = (ownPaid[owner] ?? 0) + e.amountCents;
    }
    if (e.status === "pago" && e.paidByMemberId) {
      const p = index.get(e.paidByMemberId);
      if (p !== undefined) paid[p] = (paid[p] ?? 0) + e.amountCents;
    }
  }

  const hasParticipants = members.some((m) => m.participatesInSplit);
  const familyShare = hasParticipants
    ? splitAmount(familyTotal, rule, members)
    : new Array<number>(n).fill(0);
  const familyPaidShare = hasParticipants
    ? splitAmount(familyPaidTotal, rule, members)
    : new Array<number>(n).fill(0);

  const summaries: MemberSummary[] = members.map((m, i) => {
    const ownCents = own[i] ?? 0;
    const familyShareCents = familyShare[i] ?? 0;
    const paidCents = paid[i] ?? 0;
    const paidResponsibilityCents = (ownPaid[i] ?? 0) + (familyPaidShare[i] ?? 0);
    return {
      memberId: m.id,
      ownCents,
      familyShareCents,
      responsibilityCents: ownCents + familyShareCents,
      paidCents,
      paidResponsibilityCents,
      balanceCents: paidCents - paidResponsibilityCents,
    };
  });

  return {
    members: summaries,
    unassignedFamilyCents: hasParticipants ? 0 : familyTotal,
    settlements: settle(summaries),
  };
}
