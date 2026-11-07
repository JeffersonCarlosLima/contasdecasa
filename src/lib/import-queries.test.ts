import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import {
  getBatchReview,
  listBatches,
  listMappings,
  listRules,
} from "./import-queries";

describe("import-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listBatches", () => {
    it("lista os lotes da família ordenados por data", async () => {
      const mockRows = [
        {
          batch: {
            id: "b1",
            layout: "nubank-conta",
            filename: "extrato.csv",
            fileSize: 1024,
            rowCount: 5,
            status: "confirmado" as const,
            confirmedAt: new Date("2026-11-05"),
            undoneAt: null,
            createdAt: new Date("2026-11-04"),
          },
          paymentMethod: { id: "pm1", name: "Nubank" },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
          importedBy: { id: "m1", displayName: "Jefferson" },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockRows),
                }),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await listBatches("fam_1");
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("b1");
      expect(result[0]!.paymentMethod.name).toBe("Nubank");
      expect(result[0]!.ownerMember?.displayName).toBe("Jefferson");
    });
  });

  describe("getBatchReview", () => {
    it("retorna null se o lote não existir", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await getBatchReview("fam_1", "b_inexistente");
      expect(result).toBeNull();
    });

    it("calcula o resumo de revisão corretamente", async () => {
      const mockBatchRow = {
        batch: {
          id: "b1",
          layout: "inter-conta",
          filename: "extrato_inter.csv",
          fileSize: 2048,
          rowCount: 3,
          status: "rascunho" as const,
          confirmedAt: null,
          undoneAt: null,
          createdAt: new Date(),
        },
        paymentMethod: { id: "pm1", name: "Inter" },
        owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
        importedBy: { id: "m1", displayName: "Jefferson" },
      };

      const mockDbRows = [
        {
          row: {
            id: "r1",
            lineNo: 1,
            date: "2026-11-02",
            descriptionOriginal: "Supermercado",
            descriptionNormalized: "SUPERMERCADO",
            amountCents: -15000,
            type: "despesa" as const,
            ignoreReason: null,
            categoryId: "cat_ali",
            ownerMemberId: "m1",
            paymentMethodId: "pm1",
            selected: true,
            fingerprint: "fp1",
            situation: "nova" as const,
            matchedExpenseId: null,
            linkedExpenseId: null,
            linkedRowId: null,
            createdExpenseId: null,
            targetMemberIncomeId: null,
            appliedExtraCents: null,
            previousSalaryCents: null,
          },
          category: { id: "cat_ali", name: "Alimentação", color: "chart-1" },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
          paymentMethod: { id: "pm1", name: "Inter" },
          matchedExpense: { id: null, description: null, amountCents: null, dueDate: null },
        },
        {
          row: {
            id: "r2",
            lineNo: 2,
            date: "2026-11-03",
            descriptionOriginal: "TED Recebida",
            descriptionNormalized: "TED RECEBIDA",
            amountCents: 50000,
            type: "receita" as const,
            ignoreReason: null,
            categoryId: null,
            ownerMemberId: "m1",
            paymentMethodId: "pm1",
            selected: true,
            fingerprint: "fp2",
            situation: "nova" as const,
            matchedExpenseId: null,
            linkedExpenseId: null,
            linkedRowId: null,
            createdExpenseId: null,
            targetMemberIncomeId: null,
            appliedExtraCents: null,
            previousSalaryCents: null,
          },
          category: { id: null, name: null, color: null },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
          paymentMethod: { id: "pm1", name: "Inter" },
          matchedExpense: { id: null, description: null, amountCents: null, dueDate: null },
        },
        {
          row: {
            id: "r3",
            lineNo: 3,
            date: "2026-11-04",
            descriptionOriginal: "PIX duplicado",
            descriptionNormalized: "PIX DUPLICADO",
            amountCents: -5000,
            type: "despesa" as const,
            ignoreReason: null,
            categoryId: null,
            ownerMemberId: "m1",
            paymentMethodId: "pm1",
            selected: false,
            fingerprint: "fp3",
            situation: "duplicada" as const,
            matchedExpenseId: null,
            linkedExpenseId: null,
            linkedRowId: null,
            createdExpenseId: null,
            targetMemberIncomeId: null,
            appliedExtraCents: null,
            previousSalaryCents: null,
          },
          category: { id: null, name: null, color: null },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
          paymentMethod: { id: "pm1", name: "Inter" },
          matchedExpense: { id: null, description: null, amountCents: null, dueDate: null },
        },
      ];

      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([mockBatchRow]),
                  }),
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      orderBy: vi.fn().mockResolvedValue(mockDbRows),
                    }),
                  }),
                }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const data = await getBatchReview("fam_1", "b1");
      expect(data).not.toBeNull();
      expect(data!.rows).toHaveLength(3);
      expect(data!.summary.count).toBe(3);
      expect(data!.summary.selected).toBe(2);
      expect(data!.summary.expensesCents).toBe(15000);
      expect(data!.summary.incomesCents).toBe(50000);
      expect(data!.summary.duplicatesCount).toBe(1);
      expect(data!.summary.ignoredCount).toBe(1); // r3 selected: false
      expect(data!.summary.missingCategoryCount).toBe(0);
      expect(data!.summary.missingOwnerCount).toBe(0);
      expect(data!.summary.readyToConfirm).toBe(true);
    });
  });

  describe("listRules", () => {
    it("lista regras de classificação por prioridade", async () => {
      const mockRules = [
        {
          rule: {
            id: "r1",
            matchType: "contem" as const,
            pattern: "IFOOD",
            priority: 10,
            createdAt: new Date(),
          },
          category: { id: "cat1", name: "Alimentação", color: "chart-1" },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a" },
          paymentMethod: { id: "pm1", name: "Cartão Inter" },
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockRules),
                }),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await listRules("fam_1");
      expect(result).toHaveLength(1);
      expect(result[0]!.pattern).toBe("IFOOD");
      expect(result[0]!.category.name).toBe("Alimentação");
    });
  });

  describe("listMappings", () => {
    it("lista mapeamentos da família", async () => {
      const mockMappings = [
        {
          id: "m1",
          name: "Banco X",
          config: {
            separator: ";",
            headerSignature: ["Data", "Valor"],
            dateColumn: "Data",
            dateFormat: "dd/mm/yyyy",
            descriptionColumns: ["Histórico"],
            amountColumn: "Valor",
            decimal: ",",
          },
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMappings),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await listMappings("fam_1");
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Banco X");
    });
  });
});
