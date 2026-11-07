import { describe, expect, it } from "vitest";
import { formatInstallmentText, formatSplitNames } from "./_list/format-utils";

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
});
