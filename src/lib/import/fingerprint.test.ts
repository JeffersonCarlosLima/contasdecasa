import { describe, expect, it } from "vitest";
import { fingerprint } from "./fingerprint";

describe("fingerprint", () => {
  it("gera hash SHA-256 determinístico de 64 caracteres hexadecimais", () => {
    const fp1 = fingerprint({
      familyId: "fam_123",
      paymentMethodId: "pay_456",
      date: "2026-11-05",
      amountCents: -15000,
      descriptionNormalized: "MERCADO EXTRA",
      externalId: "doc_999",
    });

    const fp2 = fingerprint({
      familyId: "fam_123",
      paymentMethodId: "pay_456",
      date: "2026-11-05",
      amountCents: -15000,
      descriptionNormalized: "MERCADO EXTRA",
      externalId: "doc_999",
    });

    expect(fp1).toHaveLength(64);
    expect(fp1).toMatch(/^[a-f0-9]{64}$/);
    expect(fp1).toBe(fp2);
  });

  it("gera hashes diferentes para valores ou datas diferentes", () => {
    const base = {
      familyId: "fam_123",
      paymentMethodId: "pay_456",
      date: "2026-11-05",
      amountCents: -15000,
      descriptionNormalized: "MERCADO EXTRA",
    };

    const fp1 = fingerprint(base);
    const fpDiffAmount = fingerprint({ ...base, amountCents: -15001 });
    const fpDiffDate = fingerprint({ ...base, date: "2026-11-06" });
    const fpDiffDesc = fingerprint({ ...base, descriptionNormalized: "MERCADO DIA" });

    expect(fp1).not.toBe(fpDiffAmount);
    expect(fp1).not.toBe(fpDiffDate);
    expect(fp1).not.toBe(fpDiffDesc);
  });

  it("lida com campos opcionais nulos ou indefinidos de forma consistente", () => {
    const fpWithNull = fingerprint({
      familyId: "fam_123",
      paymentMethodId: null,
      date: "2026-11-05",
      amountCents: 5000,
      descriptionNormalized: "PIX",
      externalId: null,
    });

    const fpWithUndefined = fingerprint({
      familyId: "fam_123",
      paymentMethodId: undefined,
      date: "2026-11-05",
      amountCents: 5000,
      descriptionNormalized: "PIX",
      externalId: undefined,
    });

    expect(fpWithNull).toBe(fpWithUndefined);
  });
});
