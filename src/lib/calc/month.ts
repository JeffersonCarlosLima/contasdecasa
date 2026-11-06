import { allocate } from "./allocate";
import type { InvestMode, MemberIncome } from "./types";

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Renda da família = soma de salário + extra de todos os membros. */
export function familyIncome(incomes: MemberIncome[]): number {
  return sum(incomes.map((i) => i.salaryCents + i.extraCents));
}

/** Investimento: valor fixo (centavos) ou percentual (pontos-base) × renda. */
export function investment(mode: InvestMode, value: number, incomeCents: number): number {
  if (mode === "valor") return value;
  return Math.round((incomeCents * value) / 10_000);
}

/** Disponível = renda − investimento. */
export const available = (incomeCents: number, investmentCents: number) =>
  incomeCents - investmentCents;

/** Sobra = disponível − gasto. Pode ser negativa. */
export const leftover = (availableCents: number, spentCents: number) =>
  availableCents - spentCents;

export interface MonthSummary {
  incomeCents: number;
  investmentCents: number;
  availableCents: number;
  spentCents: number;
  leftoverCents: number;
}

export function monthSummary(args: {
  incomes: MemberIncome[];
  investMode: InvestMode;
  investValue: number;
  expenseAmounts: number[];
}): MonthSummary {
  const incomeCents = familyIncome(args.incomes);
  const investmentCents = investment(args.investMode, args.investValue, incomeCents);
  const availableCents = available(incomeCents, investmentCents);
  const spentCents = sum(args.expenseAmounts);
  return {
    incomeCents,
    investmentCents,
    availableCents,
    spentCents,
    leftoverCents: leftover(availableCents, spentCents),
  };
}

/** Distribuição de uma barra em partes inteiras que somam exatamente 10000 (pontos-base). */
export const percentBp = (parts: number[]) => allocate(10_000, parts);
