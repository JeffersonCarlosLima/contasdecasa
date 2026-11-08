import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  guessAmountColumn,
  guessCreditColumn,
  guessDateColumn,
  guessDebitColumn,
  guessDescriptionColumn,
  guessIdentifierColumn,
  validateFile,
} from "./helpers";

describe("upload helpers", () => {
  describe("validateFile", () => {
    it("rejeita arquivo nulo", () => {
      const res = validateFile(null);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Selecione um arquivo .csv.");
    });

    it("rejeita arquivo que não seja CSV", () => {
      const fakeFile = new File(["dummy content"], "extrato.pdf", {
        type: "application/pdf",
      });
      const res = validateFile(fakeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Formato inválido. Selecione um arquivo .csv.");
    });

    it("rejeita arquivo com tamanho zero", () => {
      const fakeFile = new File([], "vazio.csv", { type: "text/csv" });
      const res = validateFile(fakeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("O arquivo selecionado está vazio.");
    });

    it("rejeita arquivo maior que 5 MB", () => {
      const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
      const fakeFile = new File([largeContent], "grande.csv", {
        type: "text/csv",
      });
      const res = validateFile(fakeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Arquivo muito grande. O limite é de 5 MB.");
    });

    it("aceita arquivo CSV válido", () => {
      const validContent = "Data;Descricao;Valor\n01/11/2026;Padaria;-15.50";
      const fakeFile = new File([validContent], "extrato.csv", {
        type: "text/csv",
      });
      const res = validateFile(fakeFile);
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe("formatFileSize", () => {
    it("formata bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("formata kilobytes com vírgula decimal", () => {
      expect(formatFileSize(1536)).toBe("1,5 KB");
    });

    it("formata megabytes com vírgula decimal", () => {
      expect(formatFileSize(2 * 1024 * 1024)).toBe("2,0 MB");
    });
  });

  describe("heurísticas de detecção de colunas (guessing)", () => {
    const headers = [
      "Data Movimento",
      "Histórico de Lançamento",
      "Número Documento",
      "Valor da Operação",
      "Crédito",
      "Débito",
    ];

    it("identifica coluna de data", () => {
      expect(guessDateColumn(headers)).toBe("Data Movimento");
      expect(guessDateColumn(["outro", "date", "mais"])).toBe("date");
      expect(guessDateColumn(["desconhecido"])).toBe("desconhecido");
    });

    it("identifica coluna de descrição", () => {
      expect(guessDescriptionColumn(headers)).toBe("Histórico de Lançamento");
      expect(
        guessDescriptionColumn(["Data", "Descricao", "Valor"])
      ).toBe("Descricao");
      expect(guessDescriptionColumn(["Data", "Memo", "Valor"])).toBe("Memo");
    });

    it("identifica coluna única de valor", () => {
      expect(guessAmountColumn(headers)).toBe("Valor da Operação");
      expect(guessAmountColumn(["Data", "Descricao", "Total"])).toBe("Total");
      expect(guessAmountColumn(["Data", "Descricao", "Saldo"])).toBeUndefined();
    });

    it("identifica coluna de crédito", () => {
      expect(guessCreditColumn(headers)).toBe("Crédito");
      expect(guessCreditColumn(["Data", "Entradas", "Saidas"])).toBe("Entradas");
      expect(guessCreditColumn(["Data", "Descricao", "Valor"])).toBeUndefined();
    });

    it("identifica coluna de débito", () => {
      expect(guessDebitColumn(headers)).toBe("Débito");
      expect(guessDebitColumn(["Data", "Entradas", "Saidas"])).toBe("Saidas");
      expect(guessDebitColumn(["Data", "Descricao", "Valor"])).toBeUndefined();
    });

    it("identifica coluna de identificador/documento", () => {
      expect(guessIdentifierColumn(headers)).toBe("Número Documento");
      expect(guessIdentifierColumn(["Data", "id", "Valor"])).toBe("id");
      expect(guessIdentifierColumn(["Data", "Codigo", "Valor"])).toBe("Codigo");
      expect(guessIdentifierColumn(["Data", "Descricao", "Valor"])).toBeUndefined();
    });
  });
});
