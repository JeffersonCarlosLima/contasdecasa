import { describe, expect, it } from "vitest";
import { COLOR_OPTIONS, PAYMENT_TYPE_LABELS } from "./_components/types";

describe("tela /tipos", () => {
  it("possui as 6 cores de categoria com rótulos especificados no design", () => {
    expect(COLOR_OPTIONS).toHaveLength(6);
    expect(COLOR_OPTIONS).toEqual([
      { color: "chart-1", label: "Telha" },
      { color: "chart-2", label: "Folha" },
      { color: "chart-3", label: "Azul" },
      { color: "chart-4", label: "Mostarda" },
      { color: "chart-5", label: "Ameixa" },
      { color: "chart-6", label: "Ardósia" },
    ]);
  });

  it("mapeia todos os tipos de forma de pagamento com rótulos em pt-BR", () => {
    expect(PAYMENT_TYPE_LABELS).toEqual({
      cartao: "Cartão",
      conta: "Conta",
      pix: "Pix",
      dinheiro: "Dinheiro",
    });
  });
});
