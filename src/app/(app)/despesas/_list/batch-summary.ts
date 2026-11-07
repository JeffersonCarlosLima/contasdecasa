import "server-only";

import { getBatchSummary, type BatchSummary } from "@/lib/import-queries";

export interface BatchImportSummary {
  batchId: string;
  currentMonth: string;
  currentMonthCount: number;
  otherMonths: Array<{ month: string; count: number }>;
  incomesCount: number;
  incomesMonth?: string;
  linkedCount: number;
}

/**
 * Carrega o resumo do lote importado para exibição do aviso em /despesas.
 * Chama getBatchSummary (filtrado por familyId) e adapta para o mês atual.
 * Ignora silenciosamente lotes inexistentes, de outra família ou sem itens.
 */
export async function getBatchSummaryForPage(
  familyId: string,
  batchId: string | undefined,
  currentMonth: string
): Promise<BatchImportSummary | null> {
  if (!batchId || typeof batchId !== "string" || !batchId.trim()) {
    return null;
  }

  const cleanBatchId = batchId.trim();

  try {
    const summary: BatchSummary = await getBatchSummary(familyId, cleanBatchId);
    if (!summary) return null;

    let currentMonthCount = 0;
    const otherMonths: Array<{ month: string; count: number }> = [];

    for (const item of summary.expensesByMonth) {
      if (!item) continue;
      if (item.month === currentMonth) {
        currentMonthCount = item.count;
      } else if (item.count > 0) {
        otherMonths.push({ month: item.month, count: item.count });
      }
    }

    otherMonths.sort((a, b) => a.month.localeCompare(b.month));

    const totalItems =
      currentMonthCount +
      otherMonths.reduce((sum, item) => sum + item.count, 0) +
      summary.incomesCount +
      summary.linkedCount;

    // Se o lote não gerou despesas, receitas nem vínculos (ex.: lote inexistente ou de outra família), silêncio
    if (totalItems === 0) {
      return null;
    }

    return {
      batchId: cleanBatchId,
      currentMonth,
      currentMonthCount,
      otherMonths,
      incomesCount: summary.incomesCount,
      incomesMonth: summary.incomeMonths[0] || currentMonth,
      linkedCount: summary.linkedCount,
    };
  } catch {
    // UUID inválido ou erro de consulta: ignore em silêncio
    return null;
  }
}
