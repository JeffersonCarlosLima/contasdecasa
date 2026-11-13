import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  requireMember: vi.fn(),
}));

vi.mock("@/lib/period", () => ({
  assertMonthOpen: vi.fn().mockResolvedValue(undefined),
  toMonthDate: vi.fn((m: string) => `${m.slice(0, 7)}-01`),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(async (cb) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "a0000000-0000-4000-8000-000000000001" }]),
          }),
        }),
      };
      return cb(tx);
    }),
  },
}));

import { db } from "@/db";
import { assertMonthOpen } from "@/lib/period";
import { requireMember } from "@/lib/session";
import {
  deleteExpense,
  markPaid,
  saveExpense,
  unmarkPaid,
} from "./actions";

describe("despesas actions", () => {
  const validUuid = "a0000000-0000-4000-8000-000000000001";
  const validOtherMemberUuid = "a0000000-0000-4000-8000-000000000002";

  const mockSessionMember = {
    user: { id: "usr_1" },
    member: { id: validUuid, role: "membro" as const },
    familyId: "fam_123",
    role: "membro" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireMember).mockResolvedValue(mockSessionMember as unknown as Awaited<ReturnType<typeof requireMember>>);
  });

  describe("saveExpense", () => {
    it("rejeita dados inválidos com { ok: false, error }", async () => {
      const res = await saveExpense({
        month: "2026-11",
        description: "",
        amountCents: 0,
        categoryId: validUuid,
        dueDate: "2026-11-10",
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("impede membro comum de lançar despesa para outro membro", async () => {
      const res = await saveExpense({
        month: "2026-11",
        description: "Gasolina",
        amountCents: 10000,
        categoryId: validUuid,
        ownerMemberId: validOtherMemberUuid,
        dueDate: "2026-11-10",
      });

      expect(res).toEqual({
        ok: false,
        error: "Você só pode lançar ou alterar despesas próprias ou da Família.",
      });
    });

    it("permite membro comum lançar despesa para a Família (ownerMemberId: null)", async () => {
      const res = await saveExpense({
        month: "2026-11",
        description: "Conta de Energia",
        amountCents: 18000,
        categoryId: validUuid,
        ownerMemberId: null,
        dueDate: "2026-11-10",
      });

      expect(res.ok).toBe(true);
      expect(assertMonthOpen).toHaveBeenCalledWith("fam_123", "2026-11");
    });

    it("impede lançamento quando o mês estiver fechado", async () => {
      vi.mocked(assertMonthOpen).mockRejectedValueOnce(new Error("O mês 2026-11 está fechado para edição."));

      const res = await saveExpense({
        month: "2026-11",
        description: "Mercado",
        amountCents: 10000,
        categoryId: validUuid,
        dueDate: "2026-11-10",
      });

      expect(res).toEqual({
        ok: false,
        error: "O mês 2026-11 está fechado para edição.",
      });
    });

    it("salva despesa parcelada gerando futuras", async () => {
      const res = await saveExpense({
        month: "2026-11",
        description: "Celular",
        amountCents: 20000,
        categoryId: validUuid,
        dueDate: "2026-11-15",
        installment: { current: 1, total: 3 },
      });

      expect(res.ok).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
    });

    it("salva despesa recorrente criando modelo", async () => {
      const res = await saveExpense({
        month: "2026-11",
        description: "Internet Fibra",
        amountCents: 12000,
        categoryId: validUuid,
        dueDate: "2026-11-20",
        recurring: true,
      });

      expect(res.ok).toBe(true);
      expect(db.transaction).toHaveBeenCalled();
    });

    it("atualiza despesa existente", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validUuid,
                familyId: "fam_123",
                ownerMemberId: validUuid,
                installmentGroupId: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await saveExpense({
        id: validUuid,
        month: "2026-11",
        description: "Aluguel Atualizado",
        amountCents: 80000,
        categoryId: validUuid,
        dueDate: "2026-11-05",
      });

      expect(res).toEqual({ ok: true, id: validUuid });
    });
  });

  describe("saveExpense: avulsa vira parcelada na edição", () => {
    it("converte a despesa em parcela 36/48 e gera 37 a 48 nos meses seguintes", async () => {
      const validUuid = "a0000000-0000-4000-8000-000000000001";
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: validUuid, familyId: "fam_123", ownerMemberId: validUuid, installmentGroupId: null },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const setMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
      const valuesMock = vi.fn().mockResolvedValue([]);
      vi.mocked(db.transaction).mockImplementationOnce((async (cb: (tx: unknown) => unknown) =>
        cb({
          update: vi.fn().mockReturnValue({ set: setMock }),
          insert: vi.fn().mockReturnValue({ values: valuesMock }),
        })) as never);

      const res = await saveExpense({
        id: validUuid,
        month: "2026-11",
        description: "Carro",
        amountCents: 50000,
        categoryId: validUuid,
        dueDate: "2026-11-10",
        installment: { current: 36, total: 48 },
      });

      expect(res).toEqual({ ok: true, id: validUuid });
      expect(setMock.mock.calls[0]![0]).toMatchObject({ installmentNumber: 36, installmentTotal: 48 });
      const rows = valuesMock.mock.calls[0]![0] as Array<{ installmentNumber: number; referenceMonth: string }>;
      expect(rows).toHaveLength(12);
      expect(rows[0]).toMatchObject({ installmentNumber: 37, referenceMonth: "2026-12-01" });
      expect(rows[11]).toMatchObject({ installmentNumber: 48, referenceMonth: "2027-11-01" });
    });

    it("avulsa marcada como recorrente na edição já lança 12 meses à frente", async () => {
      const validUuid = "a0000000-0000-4000-8000-000000000001";
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: validUuid, familyId: "fam_123", ownerMemberId: validUuid, installmentGroupId: null, recurringId: null },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const valuesMock = vi
        .fn()
        .mockReturnValueOnce({ returning: vi.fn().mockResolvedValue([{ id: "rec-1" }]) })
        .mockResolvedValueOnce([]);
      vi.mocked(db.transaction).mockImplementationOnce((async (cb: (tx: unknown) => unknown) =>
        cb({
          update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
          insert: vi.fn().mockReturnValue({ values: valuesMock }),
        })) as never);

      const res = await saveExpense({
        id: validUuid,
        month: "2026-11",
        description: "Internet",
        amountCents: 12000,
        categoryId: validUuid,
        dueDate: "2026-11-31".replace("31", "30"),
        recurring: true,
      });

      expect(res).toEqual({ ok: true, id: validUuid });
      const rows = valuesMock.mock.calls[1]![0] as Array<{ referenceMonth: string; recurringId: string }>;
      expect(rows).toHaveLength(12);
      expect(rows[0]).toMatchObject({ referenceMonth: "2026-12-01", recurringId: "rec-1" });
      expect(rows[11]).toMatchObject({ referenceMonth: "2027-11-01" });
    });
  });

  describe("deleteExpense", () => {
    it("impede membro comum de excluir despesa de outro membro", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validUuid,
                familyId: "fam_123",
                ownerMemberId: validOtherMemberUuid,
                referenceMonth: "2026-11-01",
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await deleteExpense(validUuid);
      expect(res).toEqual({
        ok: false,
        error: "Você só pode excluir despesas próprias ou da Família.",
      });
    });

    it("executa exclusão lógica com sucesso", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validUuid,
                familyId: "fam_123",
                ownerMemberId: validUuid,
                referenceMonth: "2026-11-01",
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await deleteExpense(validUuid);
      expect(res).toEqual({ ok: true });
    });
  });

  describe("markPaid e unmarkPaid", () => {
    it("marca despesa como paga registrando paidByMemberId", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validUuid,
                familyId: "fam_123",
                ownerMemberId: null, // Família
                referenceMonth: "2026-11-01",
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await markPaid(validUuid);
      expect(res).toEqual({ ok: true });
    });

    it("desmarca despesa paga voltando para pendente", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: validUuid,
                familyId: "fam_123",
                ownerMemberId: validUuid,
                referenceMonth: "2026-11-01",
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await unmarkPaid(validUuid);
      expect(res).toEqual({ ok: true });
    });
  });
});
