import { describe, expect, it } from "vitest";
import { isDuplicateIncome } from "./dedup";

describe("dedup - isDuplicateIncome", () => {
  const confirmedFps = new Set(["fp-confirmed-1", "fp-confirmed-2"]);

  it("retorna true para receita cujo fingerprint está nos lotes confirmados", () => {
    expect(
      isDuplicateIncome({
        fingerprint: "fp-confirmed-1",
        type: "receita",
        confirmedIncomeFingerprints: confirmedFps,
      }),
    ).toBe(true);
  });

  it("retorna true para salário cujo fingerprint está nos lotes confirmados", () => {
    expect(
      isDuplicateIncome({
        fingerprint: "fp-confirmed-2",
        type: "salario",
        confirmedIncomeFingerprints: confirmedFps,
      }),
    ).toBe(true);
  });

  it("retorna false para despesa mesmo que tenha fingerprint igual", () => {
    expect(
      isDuplicateIncome({
        fingerprint: "fp-confirmed-1",
        type: "despesa",
        confirmedIncomeFingerprints: confirmedFps,
      }),
    ).toBe(false);
  });

  it("retorna false para receita com fingerprint novo", () => {
    expect(
      isDuplicateIncome({
        fingerprint: "fp-new-3",
        type: "receita",
        confirmedIncomeFingerprints: confirmedFps,
      }),
    ).toBe(false);
  });

  it("detecta duplicata dentro do mesmo lote via seenIncomeFingerprints", () => {
    const seen = new Set(["fp-seen-in-batch"]);
    expect(
      isDuplicateIncome({
        fingerprint: "fp-seen-in-batch",
        type: "receita",
        confirmedIncomeFingerprints: confirmedFps,
        seenIncomeFingerprints: seen,
      }),
    ).toBe(true);
  });
});
