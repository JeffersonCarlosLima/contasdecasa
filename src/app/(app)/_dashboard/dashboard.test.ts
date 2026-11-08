import { describe, expect, it } from "vitest";
import {
  formatDueText,
  formatIncomeHint,
  formatInvestHint,
  formatSpentHint,
  getMonthNameLower,
  getUpcomingMetaParts,
  processCategories,
} from "./helpers";
import type { DashboardByCategoryItem } from "./types";
import type { ExpenseItem } from "@/lib/expense-queries";

describe("Dashboard helpers", () => {
  describe("getMonthNameLower", () => {
    it("extrai o mês em minúsculo de rótulos de mês", () => {
      expect(getMonthNameLower("Novembro 2026")).toBe("novembro");
      expect(getMonthNameLower("Dezembro 2025")).toBe("dezembro");
      expect(getMonthNameLower("Janeiro 2027")).toBe("janeiro");
    });
  });

  describe("formatIncomeHint", () => {
    it("retorna 'Sem renda informada' quando renda for 0", () => {
      expect(formatIncomeHint(0)).toBe("Sem renda informada");
    });

    it("retorna '1 salário + extra' ou 'n salários + extra'", () => {
      expect(formatIncomeHint(500000, 1, true)).toBe("1 salário + extra");
      expect(formatIncomeHint(900000, 2, true)).toBe("2 salários + extra");
    });

    it("retorna sem extra quando hasExtra for false", () => {
      expect(formatIncomeHint(800000, 2, false)).toBe("2 salários");
      expect(formatIncomeHint(400000, 1, false)).toBe("1 salário");
    });
  });

  describe("formatInvestHint", () => {
    it("retorna 0% quando renda ou investimento for 0", () => {
      expect(formatInvestHint(0, 900000)).toBe("0% da renda");
      expect(formatInvestHint(100000, 0)).toBe("0% da renda");
    });

    it("calcula percentual com formatação correta", () => {
      // 1500 / 9000 = 16.666% -> 16,7%
      expect(formatInvestHint(150000, 900000)).toBe("16,7% da renda");
      // 1000 / 10000 = 10%
      expect(formatInvestHint(100000, 1000000)).toBe("10% da renda");
    });
  });

  describe("formatSpentHint", () => {
    it("formata valor pendente em BRL", () => {
      expect(formatSpentHint(523517)).toBe("R$ 5.235,17 pendentes");
      expect(formatSpentHint(0)).toBe("R$ 0,00 pendentes");
    });
  });

  describe("processCategories", () => {
    it("mantém categorias intactas se <= 6", () => {
      const items: DashboardByCategoryItem[] = [
        { category: { id: "1", name: "Alimentação", color: "chart-1", monthlyLimitCents: null }, totalCents: 5000 },
        { category: { id: "2", name: "Transporte", color: "chart-2", monthlyLimitCents: null }, totalCents: 3000 },
      ];
      const result = processCategories(items);
      expect(result).toHaveLength(2);
      expect(result[0]!.category.name).toBe("Alimentação");
    });

    it("agrupa a partir da 6ª categoria em 'Outras' na cor chart-6", () => {
      const items: DashboardByCategoryItem[] = [
        { category: { id: "1", name: "Cat 1", color: "chart-1", monthlyLimitCents: null }, totalCents: 10000 },
        { category: { id: "2", name: "Cat 2", color: "chart-2", monthlyLimitCents: null }, totalCents: 8000 },
        { category: { id: "3", name: "Cat 3", color: "chart-3", monthlyLimitCents: null }, totalCents: 6000 },
        { category: { id: "4", name: "Cat 4", color: "chart-4", monthlyLimitCents: null }, totalCents: 4000 },
        { category: { id: "5", name: "Cat 5", color: "chart-5", monthlyLimitCents: null }, totalCents: 2000 },
        { category: { id: "6", name: "Cat 6", color: "chart-1", monthlyLimitCents: null }, totalCents: 1000 },
        { category: { id: "7", name: "Cat 7", color: "chart-2", monthlyLimitCents: null }, totalCents: 500 },
      ];

      const result = processCategories(items);
      expect(result).toHaveLength(6);
      expect(result[5]!.category.name).toBe("Outras");
      expect(result[5]!.category.color).toBe("chart-6");
      expect(result[5]!.totalCents).toBe(1500); // 1000 + 500
    });
  });

  describe("formatDueText", () => {
    it("retorna 'venceu DD/MM' quando atrasado", () => {
      expect(formatDueText("2026-11-03", "atrasado")).toBe("venceu 03/11");
    });

    it("retorna 'vence DD/MM' quando pendente ou pago", () => {
      expect(formatDueText("2026-11-12", "pendente")).toBe("vence 12/11");
      expect(formatDueText("2026-11-15", "pago")).toBe("vence 15/11");
    });
  });

  describe("getUpcomingMetaParts", () => {
    it("monta partes completas incluindo parcela e notas", () => {
      const item: ExpenseItem = {
        id: "exp-1",
        description: "Parcela do carro",
        amountCents: 108800,
        category: { id: "c1", name: "Transporte", color: "chart-3" },
        owner: { id: "m1", displayName: "Lorrane", color: "person-b", removed: false },
        paymentMethod: null,
        dueDate: "2026-11-03",
        status: "atrasado",
        paidAt: null,
        paidBy: null,
        installment: { current: 7, total: 8 },
        recurring: false,
        notes: "seguro incluso",
        referenceMonth: "2026-11",
      };

      const parts = getUpcomingMetaParts(item);
      expect(parts).toEqual([
        "venceu 03/11",
        "parcela 7 de 8",
        "seguro incluso",
      ]);
    });

    it("lida com itens sem parcela ou notas", () => {
      const item: ExpenseItem = {
        id: "exp-2",
        description: "Energia",
        amountCents: 15000,
        category: { id: "c2", name: "Contas", color: "chart-5" },
        owner: null,
        paymentMethod: null,
        dueDate: "2026-11-15",
        status: "pendente",
        paidAt: null,
        paidBy: null,
        installment: null,
        recurring: true,
        notes: null,
        referenceMonth: "2026-11",
      };

      const parts = getUpcomingMetaParts(item);
      expect(parts).toEqual(["vence 15/11"]);
    });
  });
});
