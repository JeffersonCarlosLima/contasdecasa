import { describe, expect, it } from "vitest";
import { displayStatus, monthLabel, parseMonthParam, shortDate, todayISO } from "./dates";

describe("dates", () => {
  it("shortDate aceita string ISO", () => {
    expect(shortDate("2026-11-10")).toBe("10/11");
  });

  it("shortDate aceita Date (paid_at) no fuso da família, sem produzir '05/ov'", () => {
    expect(shortDate(new Date("2026-11-05T12:00:00Z"))).toBe("05/11");
    // 02:00Z ainda é dia anterior em America/Araguaina (UTC-3)
    expect(shortDate(new Date("2026-11-05T02:00:00Z"))).toBe("04/11");
  });

  it("todayISO e monthLabel", () => {
    expect(todayISO(new Date("2026-11-05T12:00:00Z"))).toBe("2026-11-05");
    expect(monthLabel("2026-11")).toBe("Novembro 2026");
  });

  it("parseMonthParam rejeita valores inválidos", () => {
    expect(parseMonthParam("2026-13")).toMatch(/^\d{4}-\d{2}$/);
    expect(parseMonthParam("2026-03")).toBe("2026-03");
  });

  it("displayStatus calcula atrasado", () => {
    expect(displayStatus({ status: "pendente", dueDate: "2026-11-01" }, "2026-11-05")).toBe("atrasado");
    expect(displayStatus({ status: "pendente", dueDate: "2026-11-09" }, "2026-11-05")).toBe("pendente");
    expect(displayStatus({ status: "pago", dueDate: "2026-11-01" }, "2026-11-05")).toBe("pago");
  });
});
