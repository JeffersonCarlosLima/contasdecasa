import { describe, expect, it } from "vitest";
import {
  archiveCategorySchema,
  deletePaymentMethodSchema,
  saveCategorySchema,
  savePaymentMethodSchema,
} from "./cadastros";

describe("saveCategorySchema", () => {
  it("valida payload de categoria correto", () => {
    const valid = {
      id: "a0000000-0000-4000-8000-000000000001",
      name: "Supermercado",
      color: "chart-2",
      nature: "variavel",
      monthlyLimitCents: 150000,
    };
    const res = saveCategorySchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("permite monthlyLimitCents nulo ou vazio", () => {
    const resNull = saveCategorySchema.safeParse({
      name: "Internet",
      color: "chart-5",
      nature: "fixa",
      monthlyLimitCents: null,
    });
    expect(resNull.success).toBe(true);

    const resEmpty = saveCategorySchema.safeParse({
      name: "Internet",
      color: "chart-5",
      nature: "fixa",
      monthlyLimitCents: "",
    });
    expect(resEmpty.success).toBe(true);
  });

  it("rejeita cor ou natureza inválidas", () => {
    const invalidColor = saveCategorySchema.safeParse({
      name: "Teste",
      color: "chart-99",
      nature: "fixa",
    });
    expect(invalidColor.success).toBe(false);

    const invalidNature = saveCategorySchema.safeParse({
      name: "Teste",
      color: "chart-1",
      nature: "outra",
    });
    expect(invalidNature.success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const emptyName = saveCategorySchema.safeParse({
      name: "   ",
      color: "chart-1",
      nature: "fixa",
    });
    expect(emptyName.success).toBe(false);
  });

  it("rejeita id que não é uuid v4 válido", () => {
    const res = saveCategorySchema.safeParse({
      id: "invalido",
      name: "Mercado",
      color: "chart-1",
      nature: "fixa",
    });
    expect(res.success).toBe(false);
  });
});

describe("savePaymentMethodSchema", () => {
  it("valida forma de pagamento válida com uuid v4 real", () => {
    const valid = {
      id: "a0000000-0000-4000-8000-000000000001",
      name: "Cartão Nubank",
      type: "cartao",
      ownerMemberId: "a0000000-0000-4000-8000-000000000002",
    };
    const res = savePaymentMethodSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("permite ownerMemberId nulo ou vazio", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "Conta Conjunta",
      type: "conta",
      ownerMemberId: "",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.ownerMemberId).toBeNull();
    }
  });

  it("rejeita tipo inválido", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "Cheque",
      type: "cheque",
    });
    expect(res.success).toBe(false);
  });

  it("rejeita ownerMemberId que não é uuid válido", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      ownerMemberId: "membro-invalido",
    });
    expect(res.success).toBe(false);
  });
});

describe("archiveCategorySchema e deletePaymentMethodSchema", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";

  it("valida uuid v4 RFC 4122 correto", () => {
    expect(archiveCategorySchema.safeParse({ id: validUuid }).success).toBe(true);
    expect(deletePaymentMethodSchema.safeParse({ id: validUuid }).success).toBe(true);
  });

  it("rejeita id vazio, em branco ou uuid inválido", () => {
    expect(archiveCategorySchema.safeParse({ id: "" }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({ id: "   " }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({ id: "invalido" }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({}).success).toBe(false);

    expect(deletePaymentMethodSchema.safeParse({ id: "" }).success).toBe(false);
    expect(deletePaymentMethodSchema.safeParse({ id: "   " }).success).toBe(false);
    expect(deletePaymentMethodSchema.safeParse({ id: "invalido" }).success).toBe(false);
    expect(deletePaymentMethodSchema.safeParse({}).success).toBe(false);
  });
});
