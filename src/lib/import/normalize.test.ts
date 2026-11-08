import { describe, expect, it } from "vitest";
import { normalizeDescription } from "./normalize";

describe("normalizeDescription", () => {
  it("converte para maiúsculas e remove acentos", () => {
    expect(normalizeDescription("Padaria Pão & Café")).toBe("PADARIA PAO & CAFE");
    expect(normalizeDescription("açougue do zé")).toBe("AÇOUGUE DO ZE".normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  });

  it("remove datas em diversos formatos", () => {
    expect(normalizeDescription("PAGAMENTO DE FATURA 05/11/2026")).toBe("PAGAMENTO DE FATURA");
    expect(normalizeDescription("TED 05/11/26 SALDO")).toBe("TED SALDO");
    expect(normalizeDescription("COMPRA 2026-11-05 LOJA")).toBe("COMPRA LOJA");
  });

  it("remove sufixos de parcelas", () => {
    expect(normalizeDescription("MERCADO EXTRA PARC 02/10")).toBe("MERCADO EXTRA");
    expect(normalizeDescription("MAGAZINE LUIZA 3/12")).toBe("MAGAZINE LUIZA");
    expect(normalizeDescription("LOJA CEM PARCELA 5")).toBe("LOJA CEM");
  });

  it("remove números longos (documentos, IDs, autorizações)", () => {
    expect(normalizeDescription("PIX ENVIADO 123456789 JOAO")).toBe("PIX ENVIADO JOAO");
    expect(normalizeDescription("DOC 998877 BANCO")).toBe("DOC BANCO");
  });

  it("preserva identificadores curtos mas colapsa espaços", () => {
    expect(normalizeDescription("POSTO   SHELL   01")).toBe("POSTO SHELL 01");
  });

  it("lida com string vazia ou nula", () => {
    expect(normalizeDescription("")).toBe("");
    expect(normalizeDescription("   ")).toBe("");
  });
});
