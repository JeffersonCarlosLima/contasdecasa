import { describe, expect, it } from "vitest";
import { cardInvoice } from "./card-invoice";

describe("cardInvoice", () => {
  describe("4 exemplos da nota técnica", () => {
    it("fecha 5, vence 15: compra 03/05 -> vence 15/05 (maio)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-03",
        closingDay: 5,
        dueDay: 15,
      });
      expect(result).toEqual({
        referenceMonth: "2026-05-01",
        dueDate: "2026-05-15",
      });
    });

    it("fecha 5, vence 15: compra 10/05 -> vence 15/06 (junho)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-10",
        closingDay: 5,
        dueDay: 15,
      });
      expect(result).toEqual({
        referenceMonth: "2026-06-01",
        dueDate: "2026-06-15",
      });
    });

    it("fecha 25, vence 5: compra 20/05 -> vence 05/06 (junho)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-20",
        closingDay: 25,
        dueDay: 5,
      });
      expect(result).toEqual({
        referenceMonth: "2026-06-01",
        dueDate: "2026-06-05",
      });
    });

    it("fecha 25, vence 5: compra 28/05 -> vence 05/07 (julho)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-28",
        closingDay: 25,
        dueDay: 5,
      });
      expect(result).toEqual({
        referenceMonth: "2026-07-01",
        dueDate: "2026-07-05",
      });
    });
  });

  describe("compra no próprio dia do fechamento", () => {
    it("entra na fatura do próprio mês quando compra no dia do fechamento (vencimento no mesmo mês)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-05",
        closingDay: 5,
        dueDay: 15,
      });
      expect(result).toEqual({
        referenceMonth: "2026-05-01",
        dueDate: "2026-05-15",
      });
    });

    it("entra na fatura do próprio mês quando compra no dia do fechamento (vencimento no mês seguinte)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-05-25",
        closingDay: 25,
        dueDay: 5,
      });
      expect(result).toEqual({
        referenceMonth: "2026-06-01",
        dueDate: "2026-06-05",
      });
    });
  });

  describe("virada de ano", () => {
    it("compra em dezembro após fechamento quando vencimento é no ano seguinte (mesmo mês do fechamento)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-12-10",
        closingDay: 5,
        dueDay: 15,
      });
      // Fecha em 01/2027, vence em 15/01/2027
      expect(result).toEqual({
        referenceMonth: "2027-01-01",
        dueDate: "2027-01-15",
      });
    });

    it("compra em dezembro antes do fechamento quando vencimento é no mês seguinte (janeiro)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-12-20",
        closingDay: 25,
        dueDay: 5,
      });
      // Fecha em 12/2026, vence em 05/01/2027
      expect(result).toEqual({
        referenceMonth: "2027-01-01",
        dueDate: "2027-01-05",
      });
    });

    it("compra em dezembro após fechamento quando vencimento é dois meses à frente (fevereiro)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-12-28",
        closingDay: 25,
        dueDay: 5,
      });
      // Fecha em 01/2027, vence em 05/02/2027
      expect(result).toEqual({
        referenceMonth: "2027-02-01",
        dueDate: "2027-02-05",
      });
    });
  });

  describe("dia 31 em mês de 30 dias", () => {
    it("ajusta vencimento no dia 31 para o dia 30 em abril", () => {
      const result = cardInvoice({
        purchaseDate: "2026-03-15",
        closingDay: 10,
        dueDay: 31,
      });
      // Compra 15/03 > 10 -> fecha em 04/2026. dueDay (31) > closingDay (10) -> vence em 04/2026.
      // Abril tem 30 dias -> 2026-04-30
      expect(result).toEqual({
        referenceMonth: "2026-04-01",
        dueDate: "2026-04-30",
      });
    });

    it("ajusta vencimento no dia 31 para dia 30 em setembro quando fatura fecha em agosto", () => {
      const result = cardInvoice({
        purchaseDate: "2026-08-20",
        closingDay: 25,
        dueDay: 31,
      });
      // Compra 20/08 <= 25 -> fecha em 08/2026. dueDay (31) > closingDay (25) -> vence em 08/2026 (31 dias).
      // Mas se dueDay <= closingDay (ex: closingDay 31, dueDay 31 -> vence mês seguinte):
      // Aqui 31 > 25, então vence em 08/2026-08-31.
      expect(result).toEqual({
        referenceMonth: "2026-08-01",
        dueDate: "2026-08-31",
      });
    });

    it("ajusta vencimento no dia 31 para 30 de novembro quando vence em novembro", () => {
      const result = cardInvoice({
        purchaseDate: "2026-10-26",
        closingDay: 25,
        dueDay: 31,
      });
      // Compra 26/10 > 25 -> fecha em 11/2026. dueDay (31) > 25 -> vence em 11/2026.
      // Novembro tem 30 dias -> 2026-11-30
      expect(result).toEqual({
        referenceMonth: "2026-11-01",
        dueDate: "2026-11-30",
      });
    });
  });

  describe("fevereiro (ano comum e bissexto)", () => {
    it("ajusta vencimento no dia 31 para 28 de fevereiro em ano comum (2026)", () => {
      const result = cardInvoice({
        purchaseDate: "2026-01-15",
        closingDay: 10,
        dueDay: 31,
      });
      // Compra 15/01 > 10 -> fecha 02/2026. dueDay (31) > 10 -> vence 02/2026.
      // 2026 não é bissexto -> 2026-02-28
      expect(result).toEqual({
        referenceMonth: "2026-02-01",
        dueDate: "2026-02-28",
      });
    });

    it("ajusta vencimento no dia 31 para 29 de fevereiro em ano bissexto (2024)", () => {
      const result = cardInvoice({
        purchaseDate: "2024-01-15",
        closingDay: 10,
        dueDay: 31,
      });
      // Compra 15/01 > 10 -> fecha 02/2024. dueDay (31) > 10 -> vence 02/2024.
      // 2024 é bissexto -> 2024-02-29
      expect(result).toEqual({
        referenceMonth: "2024-02-01",
        dueDate: "2024-02-29",
      });
    });

    it("ajusta vencimento no dia 30 para 28 de fevereiro quando vence no mês seguinte ao fechamento", () => {
      const result = cardInvoice({
        purchaseDate: "2026-01-20",
        closingDay: 25,
        dueDay: 30,
      });
      // Compra 20/01 <= 25 -> fecha 01/2026. dueDay (30) > 25 -> vence 01/2026 (31/01/2026).
      // Se closingDay for 30 e dueDay for 5:
      // Compra 10/01 <= 30 -> fecha 01/2026 -> vence 05/02/2026.
      expect(result).toEqual({
        referenceMonth: "2026-01-01",
        dueDate: "2026-01-30",
      });
    });

    it("ajusta vencimento no dia 29 para 28 de fevereiro em ano comum", () => {
      const result = cardInvoice({
        purchaseDate: "2025-01-15",
        closingDay: 10,
        dueDay: 29,
      });
      expect(result).toEqual({
        referenceMonth: "2025-02-01",
        dueDate: "2025-02-28",
      });
    });
  });

  describe("validações de entrada", () => {
    it("lança erro se a data for inválida", () => {
      expect(() =>
        cardInvoice({
          purchaseDate: "invalida",
          closingDay: 5,
          dueDay: 15,
        }),
      ).toThrow(/Data de compra inválida/);
    });

    it("lança erro se os dias estiverem fora de 1..31", () => {
      expect(() =>
        cardInvoice({
          purchaseDate: "2026-05-10",
          closingDay: 0,
          dueDay: 15,
        }),
      ).toThrow(/entre 1 e 31/);

      expect(() =>
        cardInvoice({
          purchaseDate: "2026-05-10",
          closingDay: 5,
          dueDay: 32,
        }),
      ).toThrow(/entre 1 e 31/);
    });
  });
});
