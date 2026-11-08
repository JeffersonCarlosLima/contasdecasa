import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/import-queries", () => ({
  getBatchSummary: vi.fn(),
}));

import {
  formatInstallmentText,
  formatMonthLong,
  formatSplitNames,
} from "./_list/format-utils";
import { getBatchSummaryForPage } from "./_list/batch-summary";
import { getBatchSummary } from "@/lib/import-queries";

describe("tela /despesas - format-utils", () => {
  describe("formatSplitNames", () => {
    it("retorna string vazia quando não há participantes", () => {
      expect(formatSplitNames([])).toBe("");
    });

    it("formata com 1 participante", () => {
      expect(
        formatSplitNames([
          { displayName: "Jefferson", participatesInSplit: true },
        ])
      ).toBe("dividida com Jefferson");
    });

    it("formata com 2 participantes conforme o protótipo", () => {
      expect(
        formatSplitNames([
          { displayName: "Jefferson", participatesInSplit: true },
          { displayName: "Lorrane", participatesInSplit: true },
        ])
      ).toBe("dividida entre Jefferson e Lorrane");
    });

    it("ignora membros fora da divisão", () => {
      expect(
        formatSplitNames([
          { displayName: "Jefferson", participatesInSplit: true },
          { displayName: "Lorrane", participatesInSplit: true },
          { displayName: "Filho(a)", participatesInSplit: false },
        ])
      ).toBe("dividida entre Jefferson e Lorrane");
    });

    it("formata com 3 participantes", () => {
      expect(
        formatSplitNames([
          { displayName: "Jefferson", participatesInSplit: true },
          { displayName: "Lorrane", participatesInSplit: true },
          { displayName: "Filho(a)", participatesInSplit: true },
        ])
      ).toBe("dividida entre Jefferson, Lorrane e Filho(a)");
    });
  });

  describe("formatInstallmentText", () => {
    it("formata parcela X de Y", () => {
      expect(formatInstallmentText({ current: 7, total: 8 }, false)).toBe(
        "7 de 8"
      );
    });

    it("formata despesa recorrente", () => {
      expect(formatInstallmentText(null, true)).toBe("Recorrente");
    });

    it("formata traço quando não é parcelada nem recorrente", () => {
      expect(formatInstallmentText(null, false)).toBe("—");
    });
  });

  describe("formatMonthLong", () => {
    it("formata ano e mês por extenso em português", () => {
      expect(formatMonthLong("2026-11")).toBe("novembro de 2026");
      expect(formatMonthLong("2026-01")).toBe("janeiro de 2026");
      expect(formatMonthLong("2025-12")).toBe("dezembro de 2025");
    });
  });

  describe("getBatchSummaryForPage", () => {
    it("ignora silenciosamente quando lote for indefinido ou vazio", async () => {
      expect(await getBatchSummaryForPage("f1", undefined, "2026-11")).toBeNull();
      expect(await getBatchSummaryForPage("f1", "", "2026-11")).toBeNull();
      expect(await getBatchSummaryForPage("f1", "   ", "2026-11")).toBeNull();
    });

    it("retorna null silenciosamente para lote inexistente, de outra família ou vazio", async () => {
      vi.mocked(getBatchSummary).mockResolvedValueOnce({
        batchId: "b-inexistente",
        expensesByMonth: [],
        linkedCount: 0,
        incomesCount: 0,
        incomeMonths: [],
      });
      const summary = await getBatchSummaryForPage(
        "fam-1",
        "b-inexistente",
        "2026-11"
      );
      expect(summary).toBeNull();
    });

    it("adapta corretamente o resumo retornado por getBatchSummary", async () => {
      vi.mocked(getBatchSummary).mockResolvedValueOnce({
        batchId: "b123",
        expensesByMonth: [
          { month: "2026-11", count: 8 },
          { month: "2026-10", count: 3 },
        ],
        linkedCount: 1,
        incomesCount: 2,
        incomeMonths: ["2026-11"],
      });

      const summary = await getBatchSummaryForPage("fam-1", "b123", "2026-11");
      expect(summary).toEqual({
        batchId: "b123",
        currentMonth: "2026-11",
        currentMonthCount: 8,
        otherMonths: [{ month: "2026-10", count: 3 }],
        incomesCount: 2,
        incomesMonth: "2026-11",
        linkedCount: 1,
      });
    });

    it("retorna null silenciosamente em caso de erro na consulta", async () => {
      vi.mocked(getBatchSummary).mockRejectedValueOnce(new Error("UUID inválido"));
      const summary = await getBatchSummaryForPage("fam-1", "bad-uuid", "2026-11");
      expect(summary).toBeNull();
    });
  });
});
