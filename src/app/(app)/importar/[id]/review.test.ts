import { describe, expect, it } from "vitest";
import {
  computeReviewTotals,
  filterReviewRows,
  formatSignedAmount,
  getSituationLabel,
} from "./_components/helpers";
import type { ImportRowReviewItem } from "./_components/types";

function mockRow(overrides: Partial<ImportRowReviewItem>): ImportRowReviewItem {
  return {
    id: overrides.id ?? "row-1",
    lineNo: overrides.lineNo ?? 1,
    date: overrides.date ?? "2026-11-01",
    descriptionOriginal: overrides.descriptionOriginal ?? "Supermercado XYZ",
    descriptionNormalized: overrides.descriptionNormalized ?? "supermercado xyz",
    amountCents: overrides.amountCents ?? -15000,
    type: overrides.type ?? "despesa",
    ignoreReason: overrides.ignoreReason ?? null,
    categoryId: "categoryId" in overrides ? overrides.categoryId! : "cat-1",
    category:
      "category" in overrides
        ? overrides.category!
        : { id: "cat-1", name: "Alimentação", color: "chart-1" },
    ownerMemberId:
      "ownerMemberId" in overrides ? overrides.ownerMemberId! : "member-1",
    ownerMember:
      "ownerMember" in overrides
        ? overrides.ownerMember!
        : { id: "member-1", displayName: "Jefferson", color: "person-a" },
    paymentMethodId: overrides.paymentMethodId ?? "pm-1",
    paymentMethod: overrides.paymentMethod ?? { id: "pm-1", name: "Nubank" },
    selected: overrides.selected ?? true,
    fingerprint: overrides.fingerprint ?? "fingerprint-1",
    situation: overrides.situation ?? "nova",
    matchedExpenseId: overrides.matchedExpenseId ?? null,
    matchedExpense: overrides.matchedExpense ?? null,
    linkedExpenseId: overrides.linkedExpenseId ?? null,
    linkedRowId: overrides.linkedRowId ?? null,
    createdExpenseId: overrides.createdExpenseId ?? null,
    targetMemberIncomeId: overrides.targetMemberIncomeId ?? null,
    appliedExtraCents: overrides.appliedExtraCents ?? null,
    previousSalaryCents: overrides.previousSalaryCents ?? null,
  };
}

describe("filterReviewRows", () => {
  const rows: ImportRowReviewItem[] = [
    mockRow({ id: "1", situation: "nova", type: "despesa" }),
    mockRow({ id: "2", situation: "duplicada", type: "despesa" }),
    mockRow({ id: "3", situation: "nova", type: "ignorar" }),
    mockRow({ id: "4", situation: "possivel_vinculo", type: "despesa" }),
  ];

  it("retorna todas as linhas quando o filtro for 'todas'", () => {
    expect(filterReviewRows(rows, "todas")).toHaveLength(4);
  });

  it("filtra apenas novas quando o filtro for 'novas'", () => {
    const novas = filterReviewRows(rows, "novas");
    expect(novas).toHaveLength(2);
    expect(novas.every((r) => r.situation === "nova")).toBe(true);
  });

  it("filtra apenas duplicadas quando o filtro for 'duplicadas'", () => {
    const dups = filterReviewRows(rows, "duplicadas");
    expect(dups).toHaveLength(1);
    expect(dups[0]?.id).toBe("2");
  });

  it("filtra apenas ignoradas quando o filtro for 'ignoradas'", () => {
    const igns = filterReviewRows(rows, "ignoradas");
    expect(igns).toHaveLength(1);
    expect(igns[0]?.id).toBe("3");
  });
});

describe("computeReviewTotals", () => {
  it("calcula totais com despesas e receitas selecionadas", () => {
    const rows: ImportRowReviewItem[] = [
      mockRow({ id: "1", type: "despesa", amountCents: -5000, categoryId: "cat-1" }),
      mockRow({ id: "2", type: "despesa", amountCents: -3000, categoryId: "cat-2" }),
      mockRow({ id: "3", type: "receita", amountCents: 10000, ownerMemberId: "m-1" }),
      mockRow({ id: "4", type: "despesa", amountCents: -2000, categoryId: "cat-1" }), // não selecionada
    ];

    const selected = new Set(["1", "2", "3"]);
    const totals = computeReviewTotals(rows, selected);

    expect(totals.selectedCount).toBe(3);
    expect(totals.expensesCents).toBe(8000);
    expect(totals.incomesCents).toBe(10000);
    expect(totals.missingCategoryCount).toBe(0);
    expect(totals.hasSelectedExpensesWithoutCategory).toBe(false);
    expect(totals.canProceedToConfirm).toBe(true);
  });

  it("bloqueia avanço se houver despesa selecionada sem categoria", () => {
    const rows: ImportRowReviewItem[] = [
      mockRow({ id: "1", type: "despesa", amountCents: -5000, categoryId: null }),
      mockRow({ id: "2", type: "despesa", amountCents: -3000, categoryId: "cat-2" }),
    ];

    const selected = new Set(["1", "2"]);
    const totals = computeReviewTotals(rows, selected);

    expect(totals.missingCategoryCount).toBe(1);
    expect(totals.hasSelectedExpensesWithoutCategory).toBe(true);
    expect(totals.canProceedToConfirm).toBe(false);
  });

  it("bloqueia avanço se houver receita selecionada sem membro responsável", () => {
    const rows: ImportRowReviewItem[] = [
      mockRow({ id: "1", type: "receita", amountCents: 5000, ownerMemberId: null }),
    ];

    const selected = new Set(["1"]);
    const totals = computeReviewTotals(rows, selected);

    expect(totals.missingOwnerCount).toBe(1);
    expect(totals.canProceedToConfirm).toBe(false);
  });

  it("bloqueia avanço se nenhuma linha estiver selecionada", () => {
    const rows: ImportRowReviewItem[] = [
      mockRow({ id: "1", type: "despesa", amountCents: -5000, categoryId: "cat-1" }),
    ];

    const selected = new Set<string>();
    const totals = computeReviewTotals(rows, selected);

    expect(totals.selectedCount).toBe(0);
    expect(totals.canProceedToConfirm).toBe(false);
  });
});

describe("formatSignedAmount", () => {
  it("formata valores negativos com sinal de menos U+2212", () => {
    const res = formatSignedAmount(-15000);
    expect(res).toContain("−");
    expect(res).toContain("150,00");
  });

  it("formata valores positivos com sinal de mais", () => {
    const res = formatSignedAmount(25000);
    expect(res).toContain("+");
    expect(res).toContain("250,00");
  });

  it("formata zero sem sinal", () => {
    const res = formatSignedAmount(0);
    expect(res).toContain("0,00");
    expect(res).not.toContain("−");
    expect(res).not.toContain("+");
  });
});

describe("getSituationLabel", () => {
  it("retorna rótulos esperados para cada situação", () => {
    expect(getSituationLabel("nova")).toEqual({ label: "Nova", badge: "paid" });
    expect(getSituationLabel("duplicada")).toEqual({ label: "Duplicada", badge: "late" });
    expect(getSituationLabel("possivel_vinculo")).toEqual({ label: "Possível vínculo", badge: "pending" });
  });
});
