import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import {
  assertMonthOpen,
  isMonthClosed,
  MonthClosedError,
  toMonthDate,
  toMonthKey,
} from "./period";

describe("period", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("utilitários de conversão de data", () => {
    it("toMonthDate converte AAAA-MM para AAAA-MM-01", () => {
      expect(toMonthDate("2026-11")).toBe("2026-11-01");
      expect(toMonthDate("2026-01")).toBe("2026-01-01");
    });

    it("toMonthDate converte AAAA-MM-DD para AAAA-MM-01 (qualquer dia do mês)", () => {
      expect(toMonthDate("2026-11-01")).toBe("2026-11-01");
      expect(toMonthDate("2026-11-02")).toBe("2026-11-01");
      expect(toMonthDate("2026-11-15")).toBe("2026-11-01");
      expect(toMonthDate("2026-11-30")).toBe("2026-11-01");
      expect(toMonthDate("2026-02-28")).toBe("2026-02-01");
    });

    it("toMonthKey converte AAAA-MM-01 para AAAA-MM", () => {
      expect(toMonthKey("2026-11-01")).toBe("2026-11");
    });
  });

  describe("isMonthClosed & assertMonthOpen", () => {
    it("retorna false e não lança erro se não houver período registrado", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const closed = await isMonthClosed("fam_1", "2026-11");
      expect(closed).toBe(false);
      await expect(assertMonthOpen("fam_1", "2026-11")).resolves.toBeUndefined();
    });

    it("retorna false e não lança erro se closedAt for nulo", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ closedAt: null }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const closed = await isMonthClosed("fam_1", "2026-11");
      expect(closed).toBe(false);
      await expect(assertMonthOpen("fam_1", "2026-11")).resolves.toBeUndefined();
    });

    it("retorna true e lança MonthClosedError quando closedAt estiver preenchido", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ closedAt: new Date() }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const closed = await isMonthClosed("fam_1", "2026-11");
      expect(closed).toBe(true);

      await expect(assertMonthOpen("fam_1", "2026-11")).rejects.toThrow(MonthClosedError);
      await expect(assertMonthOpen("fam_1", "2026-11")).rejects.toThrow(
        "O mês 2026-11 está fechado para edição.",
      );
    });
  });
});
