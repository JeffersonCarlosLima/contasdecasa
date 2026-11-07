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
