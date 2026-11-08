import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/dates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dates")>();
  return {
    ...actual,
    todayISO: vi.fn(() => "2026-11-06"),
  };
});

import { db } from "@/db";
import { getExpense, listExpenses } from "./expense-queries";

describe("expense-queries", () => {
  const mockFamilyMembers = [
    { id: "mem_1", displayName: "Jefferson", color: "person-a", status: "ativo" },
    { id: "mem_2", displayName: "Lorrane", color: "person-b", status: "ativo" },
    { id: "mem_3", displayName: "Ex-Membro", color: "person-c", status: "removido" },
  ];

  const mockRows = [
    {
      expense: {
        id: "exp_1",
        referenceMonth: "2026-11-01",
        description: "Aluguel",
        amountCents: 75000,
        categoryId: "cat_1",
        ownerMemberId: null, // Família
        createdByMemberId: "mem_1",
        paymentMethodId: "pay_1",
        dueDate: "2026-11-05", // Antes de 2026-11-06 -> atrasado se pendente
        status: "pendente",
        paidAt: null,
        paidByMemberId: null,
        installmentGroupId: null,
        installmentNumber: null,
        installmentTotal: null,
        recurringId: "rec_1",
        notes: "Aluguel mensal",
      },
      category: { id: "cat_1", name: "Moradia", color: "chart-1" },
      paymentMethod: { id: "pay_1", name: "Boleto" },
    },
    {
      expense: {
        id: "exp_2",
        referenceMonth: "2026-11-01",
        description: "Farmácia",
        amountCents: 5000,
        categoryId: "cat_2",
        ownerMemberId: "mem_1",
        createdByMemberId: "mem_1",
        paymentMethodId: null,
        dueDate: "2026-11-10",
        status: "pago",
        paidAt: new Date("2026-11-05T12:00:00Z"),
        paidByMemberId: "mem_1",
        installmentGroupId: "inst_1",
        installmentNumber: 2,
        installmentTotal: 3,
        recurringId: null,
        notes: null,
      },
      category: { id: "cat_2", name: "Saúde", color: "chart-6" },
      paymentMethod: { id: null, name: null },
    },
    {
      expense: {
        id: "exp_3",
        referenceMonth: "2026-11-01",
        description: "Curso",
        amountCents: 10000,
        categoryId: "cat_1",
        ownerMemberId: "mem_3", // Removido com despesa
        createdByMemberId: "mem_1",
        paymentMethodId: null,
        dueDate: "2026-11-20",
        status: "pendente",
        paidAt: null,
        paidByMemberId: null,
        installmentGroupId: null,
        installmentNumber: null,
        installmentTotal: null,
        recurringId: null,
        notes: null,
      },
      category: { id: "cat_1", name: "Educação", color: "chart-3" },
      paymentMethod: { id: null, name: null },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listExpenses", () => {
    it("retorna lista de despesas com status calculado, totais e grupos por pessoa", async () => {
      // 1. membros da família
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockFamilyMembers),
          }),
        } as unknown as ReturnType<typeof db.select>)
        // 2. despesas do mês
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const result = await listExpenses("fam_123", "2026-11");

      expect(result.items).toHaveLength(3);

      // exp_1: vencimento 05/11 < 06/11 e pendente -> status deve ser 'atrasado'
      expect(result.items[0]?.status).toBe("atrasado");
      expect(result.items[0]?.owner).toBeNull(); // Família
      expect(result.items[0]?.recurring).toBe(true);

      // exp_2: pago
      expect(result.items[1]?.status).toBe("pago");
      expect(result.items[1]?.owner?.displayName).toBe("Jefferson");
      expect(result.items[1]?.installment).toEqual({ current: 2, total: 3 });

      // exp_3: vencimento 20/11 >= 06/11 e pendente -> 'pendente'
      expect(result.items[2]?.status).toBe("pendente");
      expect(result.items[2]?.owner?.removed).toBe(true);

      // Totais: totalCents = 75000 + 5000 + 10000 = 90000
      // pendingCents (atrasado + pendente) = 75000 + 10000 = 85000
      expect(result.totals).toEqual({
        count: 3,
        totalCents: 90000,
        pendingCents: 85000,
      });

      // Grupos por pessoa: Jefferson (mem_1), Lorrane (mem_2), Ex-Membro (mem_3) e null (Família)
      expect(result.groups).toHaveLength(4);

      const familiaGroup = result.groups.find((g) => g.owner === null);
      expect(familiaGroup).toBeDefined();
      expect(familiaGroup?.items).toHaveLength(1);
      expect(familiaGroup?.subtotalCents).toBe(75000);

      const lorraneGroup = result.groups.find((g) => g.owner?.id === "mem_2");
      expect(lorraneGroup).toBeDefined();
      expect(lorraneGroup?.items).toHaveLength(0);
      expect(lorraneGroup?.subtotalCents).toBe(0);
    });

    it("filtra por status atrasado corretamente", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockFamilyMembers),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const result = await listExpenses("fam_123", "2026-11", { status: "atrasado" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe("exp_1");
    });
  });

  describe("getExpense", () => {
    it("retorna item completo se existir", async () => {
      vi.mocked(db.select)
        // 1. busca despesa
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockRows[1]]),
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        // 2. busca membros
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockFamilyMembers),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const result = await getExpense("fam_123", "exp_2");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("exp_2");
      expect(result?.description).toBe("Farmácia");
      expect(result?.status).toBe("pago");
      expect(result?.paidBy?.displayName).toBe("Jefferson");
    });

    it("retorna null se a despesa não for encontrada", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await getExpense("fam_123", "exp_inexistente");
      expect(result).toBeNull();
    });
  });
});
