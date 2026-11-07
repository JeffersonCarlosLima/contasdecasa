import { describe, expect, it } from "vitest";
import { formatBatchDate, formatBatchTotals, getBatchStatusLabel } from "./helpers";
import type { ImportBatchItem } from "./types";

describe("Helpers da tela /importar/historico", () => {
  describe("getBatchStatusLabel", () => {
    it("mapeia os rótulos de status em pt-BR", () => {
      expect(getBatchStatusLabel("confirmado")).toBe("Confirmado");
      expect(getBatchStatusLabel("rascunho")).toBe("Rascunho");
      expect(getBatchStatusLabel("desfeito")).toBe("Desfeito");
    });
  });

  describe("formatBatchDate", () => {
    it("retorna travessão para datas nulas ou inválidas", () => {
      expect(formatBatchDate(null)).toBe("—");
      expect(formatBatchDate(undefined)).toBe("—");
      expect(formatBatchDate("data-invalida")).toBe("—");
    });

    it("formata datas válidas com dia, mês, ano e hora", () => {
      const formatted = formatBatchDate(new Date("2026-11-07T14:30:00Z"));
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("formatBatchTotals", () => {
    it("retorna null se não houver totais ou valores zerados", () => {
      expect(formatBatchTotals(undefined)).toBeNull();
      expect(formatBatchTotals({ expensesCents: 0, incomesCents: 0, count: 0 })).toBeNull();
    });

    it("formata despesas e receitas em formato monetário BRL", () => {
      const res = formatBatchTotals({
        expensesCents: 15000,
        incomesCents: 25000,
        count: 2,
      });
      expect(res).toContain("150,00");
      expect(res).toContain("250,00");
    });
  });

  describe("Estrutura de lotes (types)", () => {
    it("permite estruturar lotes válidos", () => {
      const batch: ImportBatchItem = {
        id: "b-1",
        filename: "extrato-itau.csv",
        fileSize: 2048,
        rowCount: 10,
        layout: "nubank-conta",
        status: "confirmado",
        paymentMethodName: "Conta Itaú",
        ownerName: "Jefferson",
        importedByName: "Jefferson",
        createdAt: "2026-11-07T10:00:00Z",
        totals: {
          expensesCents: 10000,
          incomesCents: 5000,
          count: 2,
        },
      };

      expect(batch.filename).toBe("extrato-itau.csv");
      expect(batch.status).toBe("confirmado");
    });
  });
});
