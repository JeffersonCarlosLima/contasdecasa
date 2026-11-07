import { futureInstallments } from "@/lib/calc/installments";
import { monthLabel } from "@/lib/dates";
import { formatBRL } from "@/lib/money";

export const RULE_TEXT: Record<string, string> = {
  proporcional: "proporcional ao salário",
  igual: "em partes iguais",
  personalizada: "com divisão personalizada",
};

export function formatParticipantsText(names: string[]): string {
  if (names.length === 0) return "todos os membros";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function formatFamilyHint(args: {
  splitMembers: Array<{ displayName: string }>;
  defaultSplitRule: string;
  currentUserName: string;
}): string {
  const { splitMembers, defaultSplitRule, currentUserName } = args;
  const names = splitMembers.map((m) => m.displayName);
  const participants = formatParticipantsText(names);
  const rule = RULE_TEXT[defaultSplitRule] ?? "proporcional ao salário";
  return `"Família" divide a despesa entre ${participants}, ${rule}. Lançado por ${currentUserName}.`;
}

export function formatInstallmentCaption(args: {
  dueDate: string;
  current: number;
  total: number;
  amountCents: number | null;
}): string {
  const { dueDate, current, total, amountCents } = args;

  if (current < 1 || total < 1) return "";
  if (current > total) return "A parcela atual não pode ser maior que o total de parcelas.";
  if (current === total) return `Última parcela (${total} de ${total}). Não gera parcelas futuras.`;

  try {
    const futures = futureInstallments({
      dueDate,
      current,
      total,
    });

    if (futures.length === 0) return "";
    const first = futures[0];
    const last = futures[futures.length - 1];
    if (!first || !last) return "";

    const committedCents = futures.length * (amountCents ?? 0);
    const committedFormatted = formatBRL(committedCents);

    if (futures.length === 1) {
      const nextMonth = monthLabel(first.referenceMonth.slice(0, 7)).toLowerCase();
      return `Gera a parcela ${first.number} de ${total} em ${nextMonth} automaticamente. Comprometido nos próximos meses: ${committedFormatted}.`;
    }

    const nextNum = first.number;
    const lastMonth = monthLabel(last.referenceMonth.slice(0, 7)).toLowerCase();
    return `Gera as parcelas de ${nextNum} a ${total} (até ${lastMonth}) automaticamente. Comprometido nos próximos meses: ${committedFormatted}.`;
  } catch {
    return "";
  }
}

export interface ExpenseValidationInput {
  description: string;
  amountCents: number | null;
  dueDate: string;
  categoryId: string;
  isInstallment: boolean;
  installmentCurrent: number | "";
  installmentTotal: number | "";
}

export function validateExpenseForm(
  input: ExpenseValidationInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.description.trim()) {
    errors.description = "Descrição é obrigatória";
  }

  if (input.amountCents === null || input.amountCents <= 0) {
    errors.amount = "Informe um valor maior que zero.";
  }

  if (!input.dueDate) {
    errors.dueDate = "Data de vencimento é obrigatória";
  }

  if (!input.categoryId) {
    errors.categoryId = "Selecione um tipo de despesa";
  }

  if (input.isInstallment) {
    const curr = typeof input.installmentCurrent === "number" ? input.installmentCurrent : 0;
    const tot = typeof input.installmentTotal === "number" ? input.installmentTotal : 0;

    if (curr < 1) {
      errors.installmentCurrent = "Parcela atual deve ser pelo menos 1";
    }
    if (tot < 1) {
      errors.installmentTotal = "Total de parcelas deve ser pelo menos 1";
    }
    if (curr > 0 && tot > 0 && curr > tot) {
      errors.installmentCurrent = "A parcela atual não pode ser maior que o total de parcelas.";
    }
  }

  return errors;
}
