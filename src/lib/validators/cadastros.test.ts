import { describe, expect, it } from "vitest";
import {
  archiveCategorySchema,
  saveCategorySchema,
  savePaymentMethodSchema,
  setPaymentMethodArchivedSchema,
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
      type: "cartao" as const,
      ownerMemberId: "a0000000-0000-4000-8000-000000000002",
      cardLast4: "1234",
      closingDay: 5,
      dueDay: 15,
    };
    const res = savePaymentMethodSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.cardLast4).toBe("1234");
      expect(res.data.closingDay).toBe(5);
      expect(res.data.dueDay).toBe(15);
    }
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

  it("rejeita nome vazio", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "   ",
      type: "conta",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toMatch(/obrigatório/i);
    }
  });

  it("rejeita tipo inválido", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "Cheque",
      type: "cheque",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("Tipo inválido");
    }
  });

  it("rejeita dia fora de 1-31 (fechamento ou vencimento)", () => {
    const resClosing0 = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      closingDay: 0,
      dueDay: 10,
    });
    expect(resClosing0.success).toBe(false);

    const resClosing32 = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      closingDay: 32,
      dueDay: 10,
    });
    expect(resClosing32.success).toBe(false);

    const resDue0 = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      closingDay: 5,
      dueDay: 0,
    });
    expect(resDue0.success).toBe(false);

    const resDue32 = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      closingDay: 5,
      dueDay: 32,
    });
    expect(resDue32.success).toBe(false);
  });

  it("rejeita quando só um dos dias é informado", () => {
    const resOnlyClosing = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      closingDay: 5,
    });
    expect(resOnlyClosing.success).toBe(false);
    if (!resOnlyClosing.success) {
      expect(resOnlyClosing.error.issues[0]?.message).toMatch(/juntos/i);
    }

    const resOnlyDue = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      dueDay: 15,
    });
    expect(resOnlyDue.success).toBe(false);
    if (!resOnlyDue.success) {
      expect(resOnlyDue.error.issues[0]?.message).toMatch(/juntos/i);
    }
  });

  it("rejeita final do cartão inválido", () => {
    const resLetters = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      cardLast4: "12ab",
    });
    expect(resLetters.success).toBe(false);

    const resShort = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      cardLast4: "123",
    });
    expect(resShort.success).toBe(false);

    const resLong = savePaymentMethodSchema.safeParse({
      name: "Cartão",
      type: "cartao",
      cardLast4: "12345",
    });
    expect(resLong.success).toBe(false);
  });

  it("zera campos de cartão quando tipo não é cartão", () => {
    const res = savePaymentMethodSchema.safeParse({
      name: "Conta Corrente",
      type: "conta",
      cardLast4: "1234",
      closingDay: 5,
      dueDay: 15,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.cardLast4).toBeNull();
      expect(res.data.closingDay).toBeNull();
      expect(res.data.dueDay).toBeNull();
    }
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

describe("setPaymentMethodArchivedSchema", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";

  it("valida arquivamento com sucesso", () => {
    expect(setPaymentMethodArchivedSchema.safeParse({ id: validUuid, archived: true }).success).toBe(true);
    expect(setPaymentMethodArchivedSchema.safeParse({ id: validUuid, archived: false }).success).toBe(true);
  });

  it("rejeita uuid inválido ou ausente", () => {
    expect(setPaymentMethodArchivedSchema.safeParse({ id: "invalido", archived: true }).success).toBe(false);
    expect(setPaymentMethodArchivedSchema.safeParse({ archived: true }).success).toBe(false);
  });

  it("rejeita status arquivado não booleano", () => {
    expect(setPaymentMethodArchivedSchema.safeParse({ id: validUuid, archived: "sim" }).success).toBe(false);
    expect(setPaymentMethodArchivedSchema.safeParse({ id: validUuid }).success).toBe(false);
  });
});

describe("archiveCategorySchema", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";

  it("valida uuid v4 RFC 4122 correto", () => {
    expect(archiveCategorySchema.safeParse({ id: validUuid }).success).toBe(true);
  });

  it("rejeita id vazio, em branco ou uuid inválido", () => {
    expect(archiveCategorySchema.safeParse({ id: "" }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({ id: "   " }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({ id: "invalido" }).success).toBe(false);
    expect(archiveCategorySchema.safeParse({}).success).toBe(false);
  });
});
