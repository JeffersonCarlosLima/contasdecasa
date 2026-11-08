import { formatBRL, formatPercentBp } from "@/lib/money";
import { shortDate } from "@/lib/dates";
import type { DashboardByCategoryItem } from "./types";
import type { ExpenseItem } from "@/lib/expense-queries";

/** Extrai apenas o nome do mês em minúsculas a partir de "Novembro 2026" → "novembro" */
export function getMonthNameLower(monthLabelStr: string): string {
  const parts = monthLabelStr.trim().split(" ");
  return (parts[0] ?? "").toLowerCase();
}

/** Formata o texto de apoio do KPI de Renda */
export function formatIncomeHint(incomeCents: number, salaryCount?: number, hasExtra?: boolean): string {
  if (incomeCents <= 0) return "Sem renda informada";
  const count = salaryCount ?? 2;
  const extraStr = hasExtra !== false ? " + extra" : "";
  if (count <= 1) return `1 salário${extraStr}`;
  return `${count} salários${extraStr}`;
}

/** Formata o texto de apoio do KPI de Investimento */
export function formatInvestHint(investCents: number, incomeCents: number): string {
  if (incomeCents <= 0 || investCents <= 0) return "0% da renda";
  const bp = Math.round((investCents / incomeCents) * 10_000);
  return `${formatPercentBp(bp)} da renda`;
}

/** Formata o texto de apoio do KPI de Gasto */
export function formatSpentHint(pendingCents: number): string {
  return `${formatBRL(pendingCents)} pendentes`;
}

/** Processa categorias limitando a 6 (top 5 + Outras em chart-6) e ordenadas por valor decrescente */
export function processCategories(items: DashboardByCategoryItem[]): DashboardByCategoryItem[] {
  const sorted = [...items].sort((a, b) => b.totalCents - a.totalCents);
  if (sorted.length <= 6) return sorted;

  const top5 = sorted.slice(0, 5);
  const others = sorted.slice(5);
  const othersTotal = others.reduce((acc, cur) => acc + cur.totalCents, 0);

  return [
    ...top5,
    {
      category: {
        id: "outras",
        name: "Outras",
        color: "chart-6",
        monthlyLimitCents: null,
      },
      totalCents: othersTotal,
    },
  ];
}

/** Formata o trecho de data do vencimento: "venceu DD/MM" ou "vence DD/MM" */
export function formatDueText(dueDate: string, status: ExpenseItem["status"]): string {
  const dt = shortDate(dueDate);
  if (status === "atrasado") return `venceu ${dt}`;
  return `vence ${dt}`;
}

/** Monta os fragmentos textuais do meta de uma despesa */
export function getUpcomingMetaParts(item: ExpenseItem): string[] {
  const parts: string[] = [];

  // Vencimento
  parts.push(formatDueText(item.dueDate, item.status));

  // Parcela
  if (item.installment) {
    parts.push(`parcela ${item.installment.current} de ${item.installment.total}`);
  }

  // Observação
  if (item.notes && item.notes.trim()) {
    parts.push(item.notes.trim());
  }

  return parts;
}
