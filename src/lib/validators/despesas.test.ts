import { describe, expect, it } from "vitest";
import {
  deleteExpenseSchema,
  markPaidSchema,
  saveExpenseSchema,
} from "./despesas";

describe("saveExpenseSchema", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";

  it("valida despesa avulsa válida", () => {
    const input = {
      month: "2026-11",
      description: "Supermercado Semanal",
      amountCents: 25000,
      categoryId: validUuid,
      ownerMemberId: validUuid,
      dueDate: "2026-11-15",
      paid: false,
    };

    const res = saveExpenseSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("permite ownerMemberId nulo ou 'familia'", () => {
    const resNull = saveExpenseSchema.safeParse({
      month: "2026-11",
      description: "Luz",
      amountCents: 15000,
      categoryId: validUuid,
      ownerMemberId: null,
      dueDate: "2026-11-20",
    });
    expect(resNull.success).toBe(true);
    if (resNull.success) {
      expect(resNull.data.ownerMemberId).toBeNull();
    }

    const resFamilia = saveExpenseSchema.safeParse({
      month: "2026-11",
      description: "Internet",
      amountCents: 12000,
      categoryId: validUuid,
      ownerMemberId: "familia",
      dueDate: "2026-11-20",
    });
    expect(resFamilia.success).toBe(true);
    if (resFamilia.success) {
      expect(resFamilia.data.ownerMemberId).toBeNull();
    }
  });

  it("valida compra parcelada válida", () => {
    const input = {
      month: "2026-11",
      description: "Geladeira",
      amountCents: 25000,
      categoryId: validUuid,
      dueDate: "2026-11-10",
      installment: { current: 1, total: 10 },
    };

    const res = saveExpenseSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("rejeita parcela atual maior que total de parcelas", () => {
    const input = {
      month: "2026-11",
      description: "TV",
      amountCents: 20000,
      categoryId: validUuid,
      dueDate: "2026-11-10",
      installment: { current: 11, total: 10 },
    };

    const res = saveExpenseSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("rejeita valor zero ou negativo com mensagem amigável", () => {
    const resZero = saveExpenseSchema.safeParse({
      month: "2026-11",
      description: "Teste",
      amountCents: 0,
      categoryId: validUuid,
      dueDate: "2026-11-10",
    });
    expect(resZero.success).toBe(false);
    if (!resZero.success) {
      expect(resZero.error.issues[0]?.message).toBe("Informe um valor maior que zero.");
    }
  });

  it("rejeita data de vencimento em formato incorreto", () => {
    const res = saveExpenseSchema.safeParse({
      month: "2026-11",
      description: "Teste",
      amountCents: 1000,
      categoryId: validUuid,
      dueDate: "10/11/2026",
    });
    expect(res.success).toBe(false);
  });
});

describe("deleteExpenseSchema e markPaidSchema", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";

  it("valida id e escopo", () => {
    expect(deleteExpenseSchema.safeParse({ id: validUuid, scope: "proximas" }).success).toBe(true);
    expect(deleteExpenseSchema.safeParse({ id: validUuid }).success).toBe(true);
    expect(markPaidSchema.safeParse({ id: validUuid }).success).toBe(true);
  });

  it("rejeita id inválido", () => {
    expect(deleteExpenseSchema.safeParse({ id: "invalido" }).success).toBe(false);
    expect(markPaidSchema.safeParse({ id: "invalido" }).success).toBe(false);
  });
});
