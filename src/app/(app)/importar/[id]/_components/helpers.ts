import { formatBRL } from "@/lib/money";
import type { FilterStatus, ImportRowReviewItem } from "./types";

export function filterReviewRows(
  rows: ImportRowReviewItem[],
  filter: FilterStatus
): ImportRowReviewItem[] {
  switch (filter) {
    case "novas":
      return rows.filter((r) => r.situation === "nova");
    case "duplicadas":
      return rows.filter((r) => r.situation === "duplicada");
    case "ignoradas":
      return rows.filter((r) => r.type === "ignorar");
    case "todas":
    default:
      return rows;
  }
}

export interface ReviewTotals {
  totalRows: number;
  selectedCount: number;
  expensesCents: number;
  incomesCents: number;
  missingCategoryCount: number;
  missingOwnerCount: number;
  hasSelectedExpensesWithoutCategory: boolean;
  canProceedToConfirm: boolean;
}

export function computeReviewTotals(
  rows: ImportRowReviewItem[],
  selectedIds: Set<string>
): ReviewTotals {
  let expensesCents = 0;
  let incomesCents = 0;
  let missingCategoryCount = 0;
  let missingOwnerCount = 0;
  let selectedCount = 0;

  for (const row of rows) {
    // Linhas ignoradas nunca contam na seleção nem são gravadas
    if (row.type === "ignorar") continue;

    const isSelected = selectedIds.has(row.id);
    if (!isSelected) continue;

    selectedCount++;

    if (row.type === "despesa") {
      expensesCents += Math.abs(row.amountCents);
      if (!row.categoryId) {
        missingCategoryCount++;
      }
    } else if (row.type === "receita" || row.type === "salario") {
      incomesCents += Math.abs(row.amountCents);
      if (!row.ownerMemberId) {
        missingOwnerCount++;
      }
    }
  }

  const hasSelectedExpensesWithoutCategory = missingCategoryCount > 0;
  const canProceedToConfirm =
    selectedCount > 0 && !hasSelectedExpensesWithoutCategory && missingOwnerCount === 0;

  return {
    totalRows: rows.length,
    selectedCount,
    expensesCents,
    incomesCents,
    missingCategoryCount,
    missingOwnerCount,
    hasSelectedExpensesWithoutCategory,
    canProceedToConfirm,
  };
}

export function formatSignedAmount(amountCents: number): string {
  const absFormatted = formatBRL(Math.abs(amountCents));
  if (amountCents < 0) {
    return `−${absFormatted}`;
  }
  if (amountCents > 0) {
    return `+${absFormatted}`;
  }
  return absFormatted;
}

export function getSituationLabel(situation: ImportRowReviewItem["situation"]): {
  label: string;
  badge: "paid" | "pending" | "late";
} {
  switch (situation) {
    case "duplicada":
      return { label: "Duplicada", badge: "late" };
    case "possivel_vinculo":
      return { label: "Possível vínculo", badge: "pending" };
    case "nova":
    default:
      return { label: "Nova", badge: "paid" };
  }
}

export function getDisabledProceedReason(totals: {
  canProceedToConfirm: boolean;
  selectedCount: number;
  missingCategoryCount: number;
  missingOwnerCount: number;
}): string | null {
  if (totals.canProceedToConfirm) return null;

  if (totals.selectedCount === 0) {
    return "Selecione ao menos um lançamento para continuar.";
  }

  const parts: string[] = [];
  if (totals.missingCategoryCount > 0) {
    const plural = totals.missingCategoryCount > 1 ? "s" : "";
    parts.push(`a categoria de ${totals.missingCategoryCount} despesa${plural}`);
  }
  if (totals.missingOwnerCount > 0) {
    const plural = totals.missingOwnerCount > 1 ? "s" : "";
    parts.push(`o responsável de ${totals.missingOwnerCount} receita${plural}`);
  }

  if (parts.length > 0) {
    return `Defina ${parts.join(" e ")} para continuar.`;
  }

  return "Selecione ao menos um lançamento para continuar.";
}

/**
 * Define se uma linha deve iniciar selecionada na revisão.
 * Padrão: Novas marcadas, Duplicadas desmarcadas, Ignoradas desmarcadas.
 */
export function isRowAutoSelected(row: {
  situation: string;
  type: string;
  selected?: boolean;
}): boolean {
  if (row.type === "ignorar") return false;
  if (row.situation === "duplicada") return false;
  if (row.situation === "nova" || row.situation === "possivel_vinculo") {
    return true;
  }
  return Boolean(row.selected);
}

/**
 * Linhas com tipo 'ignorar' nunca são selecionáveis na revisão.
 */
export function isRowSelectable(row: { type: string }): boolean {
  return row.type !== "ignorar";
}

/**
 * Sanitiza mensagens de erro do servidor / banco de dados (ex: SQL bruto do Drizzle ou violação de unicidade)
 * para exibir textos amigáveis em pt-BR.
 */
export function sanitizeErrorMessage(error: string | null | undefined): string {
  if (!error) return "Ocorreu um erro inesperado ao processar a solicitação.";

  const raw = String(error);
  const rawLower = raw.toLowerCase();

  const isSqlOrDbError =
    rawLower.includes("failed query") ||
    rawLower.includes("insert into") ||
    rawLower.includes("update ") ||
    rawLower.includes("delete from") ||
    rawLower.includes("select ") ||
    rawLower.includes("unique constraint") ||
    rawLower.includes("violates unique constraint") ||
    rawLower.includes("duplicate key") ||
    rawLower.includes("expenses_family_fingerprint_uq") ||
    rawLower.includes("drizzle") ||
    rawLower.includes("postgres") ||
    rawLower.includes("syntax error");

  if (isSqlOrDbError) {
    if (
      rawLower.includes("duplicate key") ||
      rawLower.includes("expenses_family_fingerprint_uq") ||
      rawLower.includes("unique constraint")
    ) {
      return "Não foi possível confirmar o lote porque um ou mais lançamentos já foram importados anteriormente nesta família. Revise os lançamentos duplicados e tente novamente.";
    }
    return "Não foi possível confirmar o lote devido a um erro no banco de dados. Verifique os lançamentos e tente novamente.";
  }

  return raw;
}
