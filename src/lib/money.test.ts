import { describe, expect, it } from "vitest";
import { formatBRL, formatPercentBp, parseBRL } from "./money";

describe("money", () => {
  it("formata em reais", () => {
    expect(formatBRL(123_456)).toBe("R$ 1.234,56");
    expect(formatBRL(0)).toBe("R$ 0,00");
    expect(formatBRL(-41_230)).toBe("−R$ 412,30");
  });
  it("interpreta entrada em reais como centavos inteiros", () => {
    expect(parseBRL("1.234,56")).toBe(123_456);
    expect(parseBRL("R$ 750,00")).toBe(75_000);
    expect(parseBRL("12,5")).toBe(1_250);
    expect(parseBRL("")).toBeNull();
    expect(parseBRL("abc")).toBeNull();
  });
  it("formata percentual em pontos-base", () => {
    expect(formatPercentBp(4920)).toBe("49,2%");
  });
});
