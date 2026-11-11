import { describe, expect, it } from "vitest";
import {
  dueDateInMonth,
  formatReferenceMonth,
  parseReferenceMonth,
} from "./reference-month";

describe("reference-month", () => {
  it("normaliza YYYY-MM para o dia 1", () => {
    expect(parseReferenceMonth("2026-11")).toBe("2026-11-01");
    expect(parseReferenceMonth("2026-11-01")).toBe("2026-11-01");
  });
  it("rejeita valores inválidos", () => {
    expect(parseReferenceMonth("2026-13")).toBeNull();
    expect(parseReferenceMonth("2026-11-15")).toBeNull();
    expect(parseReferenceMonth("")).toBeNull();
    expect(parseReferenceMonth(null)).toBeNull();
  });
  it("formata MM/AAAA", () => {
    expect(formatReferenceMonth("2026-03-01")).toBe("03/2026");
  });
  it("ajusta vencimento ao fim do mês", () => {
    expect(dueDateInMonth("2026-02-01", 31)).toBe("2026-02-28");
    expect(dueDateInMonth("2028-02-01", 31)).toBe("2028-02-29");
    expect(dueDateInMonth("2026-11-01", 10)).toBe("2026-11-10");
  });
  it("compra de dezembro importada em dezembro não vai para janeiro", () => {
    expect(parseReferenceMonth("2026-12")).toBe("2026-12-01");
  });
});
