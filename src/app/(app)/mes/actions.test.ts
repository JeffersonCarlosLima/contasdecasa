import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/period", async () => {
  const actual = await vi.importActual<typeof import("@/lib/period")>("@/lib/period");
  return {
    ...actual,
    assertMonthOpen: vi.fn(),
  };
});

import { db } from "@/db";
import { assertMonthOpen } from "@/lib/period";
import { requireRole } from "@/lib/session";
import {
  closeMonth,
  copyRecurring,
  reopenMonth,
  saveMonthClose,
} from "./actions";

type SessionContext = Awaited<ReturnType<typeof requireRole>>;

describe("Fechamento do Mês (Server Actions)", () => {
  const mockAdminContext: SessionContext = {
    user: {
      id: "usr_admin",
      name: "Admin",
      email: "admin@exemplo.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    member: {
      id: "mem_admin",
      familyId: "fam_123",
      userId: "usr_admin",
      displayName: "Admin",
      role: "admin",
      kinship: "titular",
      color: "person-a",
      participatesInSplit: true,
      customPercent: null,
      status: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    familyId: "fam_123",
    role: "admin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveMonthClose", () => {
    it("bloqueia salvamento se o mês estiver fechado", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
      vi.mocked(assertMonthOpen).mockRejectedValueOnce(
        new Error("O mês 2026-11 está fechado para edição."),
      );

      const res = await saveMonthClose({
        month: "2026-11",
        incomes: [],
        investMode: "valor",
        investValue: 0,
        splitRule: "igual",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/fechado para edição/);
      }
    });

    it("valida percentuais personalizados somando exatamente 100%", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
      vi.mocked(assertMonthOpen).mockResolvedValueOnce(undefined);

      // Membros ativos somando 80% (8000 pontos-base) em vez de 100%
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "mem_1",
              participatesInSplit: true,
              customPercent: 8000,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await saveMonthClose({
        month: "2026-11",
        incomes: [],
        investMode: "valor",
        investValue: 0,
        splitRule: "personalizada",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/deve ser exatamente 100%/);
      }
    });

    it("salva período e rendas em transação quando válido", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
      vi.mocked(assertMonthOpen).mockResolvedValueOnce(undefined);

      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "period_123" }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as unknown as Parameters<typeof callback>[0]);
      });

      const res = await saveMonthClose({
        month: "2026-11",
        incomes: [
          {
            memberId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            salaryCents: 500000,
            extraCents: 0,
          },
        ],
        investMode: "valor",
        investValue: 50000,
        investDestination: "Tesouro Selic",
        splitRule: "igual",
      });

      expect(res.ok).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("copyRecurring", () => {
    it("não duplica despesas recorrentes já copiadas nem parcelas já existentes", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
      vi.mocked(assertMonthOpen).mockResolvedValueOnce(undefined);

      const mockTx = {
        select: vi
          .fn()
          // 1. active recurring: rec_1
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  id: "rec_1",
                  description: "Aluguel",
                  amountCents: 200000,
                  categoryId: "cat_1",
                  ownerMemberId: null,
                  paymentMethodId: null,
                  dueDay: 10,
                },
              ]),
            }),
          })
          // 2. already copied recurring in month: rec_1 já copiada!
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ recurringId: "rec_1" }]),
            }),
          })
          // 3. installments in family: parcela 2 de 3 já existente em 2026-11-01
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  installmentGroupId: "grp_1",
                  installmentNumber: 2,
                  installmentTotal: 3,
                  referenceMonth: "2026-11-01",
                  dueDate: "2026-11-15",
                },
              ]),
            }),
          }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as unknown as Parameters<typeof callback>[0]);
      });

      const res = await copyRecurring("2026-11");

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.copiedRecurring).toBe(0);
        expect(res.generatedInstallments).toBe(0);
      }
    });
  });

  describe("closeMonth & reopenMonth", () => {
    it("closeMonth atualiza ou insere período com closedAt", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "period_123" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await closeMonth("2026-11");
      expect(res.ok).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("reopenMonth limpa closedAt e closedBy", async () => {
      vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await reopenMonth("2026-11");
      expect(res.ok).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
