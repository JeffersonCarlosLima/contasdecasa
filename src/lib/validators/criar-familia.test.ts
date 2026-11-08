import { describe, expect, it } from "vitest";
import {
  acceptInviteSchema,
  createFamilySchema,
} from "./criar-familia";

describe("createFamilySchema", () => {
  it("valida payload completo com sucesso", () => {
    const input = {
      name: "Família Silva",
      kinship: "titular",
      splitRule: "proporcional",
      inviteEmail: "conjuge@teste.com",
    };
    const result = createFamilySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Família Silva",
        kinship: "titular",
        splitRule: "proporcional",
        inviteEmail: "conjuge@teste.com",
      });
    }
  });

  it("aplica valores padrão para kinship e splitRule", () => {
    const input = {
      name: "Família Silva",
    };
    const result = createFamilySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kinship).toBe("titular");
      expect(result.data.splitRule).toBe("igual");
      expect(result.data.inviteEmail).toBeUndefined();
    }
  });

  it("transforma inviteEmail vazio ou em branco para undefined", () => {
    const result1 = createFamilySchema.safeParse({
      name: "Família Teste",
      inviteEmail: "",
    });
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.inviteEmail).toBeUndefined();
    }

    const result2 = createFamilySchema.safeParse({
      name: "Família Teste",
      inviteEmail: "   ",
    });
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.inviteEmail).toBeUndefined();
    }
  });

  it("rejeita nome vazio ou menor que 2 caracteres", () => {
    const resultEmpty = createFamilySchema.safeParse({ name: "" });
    expect(resultEmpty.success).toBe(false);

    const resultShort = createFamilySchema.safeParse({ name: "A" });
    expect(resultShort.success).toBe(false);
  });

  it("rejeita kinship inválido", () => {
    const result = createFamilySchema.safeParse({
      name: "Família",
      kinship: "invalido",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita splitRule inválida", () => {
    const result = createFamilySchema.safeParse({
      name: "Família",
      splitRule: "invalido",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita inviteEmail com formato incorreto", () => {
    const result = createFamilySchema.safeParse({
      name: "Família",
      inviteEmail: "nao-eh-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("acceptInviteSchema", () => {
  it("valida token válido", () => {
    const result = acceptInviteSchema.safeParse({ token: "tok_123456" });
    expect(result.success).toBe(true);
  });

  it("rejeita token vazio", () => {
    const result = acceptInviteSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });
});
