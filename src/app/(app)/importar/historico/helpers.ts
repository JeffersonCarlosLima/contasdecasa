import { formatBRL } from "@/lib/money";
import type { BatchStatus, BatchTotals } from "./types";

export function formatBatchDate(val: string | Date | null | undefined): string {
  if (!val) return "—";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatBatchTotals(totals?: BatchTotals): string | null {
  if (!totals) return null;
  const parts: string[] = [];
  if (totals.expensesCents > 0) {
    parts.push(`−${formatBRL(totals.expensesCents)}`);
  }
  if (totals.incomesCents > 0) {
    parts.push(`+${formatBRL(totals.incomesCents)}`);
  }
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

export function getBatchStatusLabel(status: BatchStatus): string {
  switch (status) {
    case "confirmado":
      return "Confirmado";
    case "rascunho":
      return "Rascunho";
    case "desfeito":
      return "Desfeito";
    default:
      return status;
  }
}
