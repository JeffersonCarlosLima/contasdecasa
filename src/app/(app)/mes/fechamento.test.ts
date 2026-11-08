import { describe, expect, it } from "vitest";
import {
  computeMemberPercentages,
  formatInvestHint,
  formatSettlementCaption,
  getMonthHeading,
  getMonthName,
} from "./_components/helpers";

describe("Helpers e formatação da tela de Fechamento (/mes)", () => {
  describe("Nomes e Títulos de Mês", () => {
    it("extrai o nome do mês corretamente", () => {
      expect(getMonthName("2026-11")).toBe("novembro");
      expect(getMonthName("2026-10")).toBe("outubro");
      expect(getMonthName("2026-01")).toBe("janeiro");
      expect(getMonthName("2026-12")).toBe("dezembro");
    });

    it("monta o cabeçalho 'Fechamento de {mês}'", () => {
      expect(getMonthHeading("2026-11")).toBe("Fechamento de novembro");
      expect(getMonthHeading("2026-10")).toBe("Fechamento de outubro");
    });
  });

  describe("formatInvestHint", () => {
    it("formata a porcentagem da renda quando o modo é valor fixo", () => {
      // R$ 1.500,00 de R$ 9.000,00 = 16,666...% -> 16,7%
      const hint = formatInvestHint("valor", 150_000, 900_000, "novembro");
      expect(hint).toBe("16,7% da renda de novembro.");
    });

    it("formata o valor em R$ quando o modo é percentual", () => {
      // 1500 pontos-base = 15% de R$ 10.000,00 = R$ 1.500,00
      const hint = formatInvestHint("percentual", 1500, 1_000_000, "novembro");
      expect(hint).toBe("R$ 1.500,00 da renda de novembro.");
    });

    it("trata renda zerada com segurança", () => {
      expect(formatInvestHint("valor", 10_000, 0, "novembro")).toBe("0,0% da renda de novembro.");
      expect(formatInvestHint("percentual", 1000, 0, "novembro")).toBe("R$ 0,00 da renda de novembro.");
    });
  });

  describe("computeMemberPercentages", () => {
    it("divide em partes iguais (50% cada) para 2 participantes", () => {
      const members = [
        { id: "m1", participatesInSplit: true, salaryCents: 320_000, customPercent: null },
        { id: "m2", participatesInSplit: true, salaryCents: 330_000, customPercent: null },
        { id: "m3", participatesInSplit: false, salaryCents: 0, customPercent: null },
      ];

      const percentages = computeMemberPercentages("igual", members);
      expect(percentages.get("m1")).toBe("50%");
      expect(percentages.get("m2")).toBe("50%");
      expect(percentages.get("m3")).toBe("—");
    });

    it("calcula divisão proporcional com base nos salários (49,2% e 50,8%)", () => {
      // 3.200 / 6.500 = 49,23% -> 49,2%
      // 3.300 / 6.500 = 50,76% -> 50,8%
      const members = [
        { id: "m1", participatesInSplit: true, salaryCents: 320_000, customPercent: null },
        { id: "m2", participatesInSplit: true, salaryCents: 330_000, customPercent: null },
      ];

      const percentages = computeMemberPercentages("proporcional", members);
      expect(percentages.get("m1")).toBe("49,2%");
      expect(percentages.get("m2")).toBe("50,8%");
    });

    it("aplica percentual personalizado quando a regra é personalizada", () => {
      const members = [
        { id: "m1", participatesInSplit: true, salaryCents: 0, customPercent: 7000 },
        { id: "m2", participatesInSplit: true, salaryCents: 0, customPercent: 3000 },
      ];

      const percentages = computeMemberPercentages("personalizada", members);
      expect(percentages.get("m1")).toBe("70%");
      expect(percentages.get("m2")).toBe("30%");
    });
  });

  describe("formatSettlementCaption", () => {
    it("monta o texto de acerto com pagamentos e saldo de dívida", () => {
      const caption = formatSettlementCaption({
        members: [
          { id: "m1", displayName: "Jefferson", paidCents: 75_000 },
          { id: "m2", displayName: "Lorrane", paidCents: 15_000 },
        ],
        settlements: [{ fromMemberId: "m2", toMemberId: "m1", cents: 30_692 }],
      });

      expect(caption).toContain(
        "Até agora: Jefferson pagou R$ 750,00 e Lorrane R$ 150,00 das despesas da família.",
      );
      expect(caption).toContain("Pelo que já foi pago, Lorrane deve R$ 306,92 a Jefferson.");
    });

    it("monta texto quando não há acerto pendente", () => {
      const caption = formatSettlementCaption({
        members: [
          { id: "m1", displayName: "Jefferson", paidCents: 50_000 },
          { id: "m2", displayName: "Lorrane", paidCents: 50_000 },
        ],
        settlements: [],
      });

      expect(caption).toContain("Nenhum acerto pendente entre vocês.");
    });
  });
});
