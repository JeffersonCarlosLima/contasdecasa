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
  getBatchSummary,
  getConfirmedIncomeFingerprints,
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

    it("não conta linha com tipo 'ignorar' em selected mesmo quando r.selected é true", async () => {
      const mockBatchRow = {
        batch: {
          id: "b2",
          layout: "csv_padrao" as const,
          filename: "extrato.csv",
          fileSize: 1024,
          rowCount: 1,
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
            batchId: "b2",
            familyId: "fam_1",
            lineNo: 1,
            date: "2026-11-05",
            descriptionOriginal: "Pagamento Fatura",
            descriptionNormalized: "PAGAMENTO FATURA",
            amountCents: -144020,
            type: "ignorar" as const,
            ignoreReason: "Pagamento fatura",
            categoryId: null,
            ownerMemberId: null,
            paymentMethodId: "pm1",
            selected: true,
            fingerprint: "fp1",
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
          owner: { id: null, displayName: null, color: null },
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

      const data = await getBatchReview("fam_1", "b2");
      expect(data).not.toBeNull();
      // selected NÃO deve contar linha com tipo 'ignorar', mesmo com selected: true
      expect(data!.summary.selected).toBe(0);
      expect(data!.summary.expensesCents).toBe(0);
      expect(data!.summary.incomesCents).toBe(0);
      expect(data!.summary.ignoredCount).toBe(1);
      expect(data!.summary.readyToConfirm).toBe(false);
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

  describe("getBatchSummary", () => {
    it("retorna resumo com despesas agrupadas por mês, despesas vinculadas e receitas", async () => {
      const mockCreatedExpenses = [
        { referenceMonth: "2026-11-01" },
        { referenceMonth: "2026-11-01" },
        { referenceMonth: "2026-10-01" },
      ];

      const mockRows = [
        {
          id: "r1",
          date: "2026-11-05",
          type: "despesa" as const,
          selected: true,
          linkedExpenseId: "exp-linked-1",
          createdExpenseId: "exp-linked-1",
          targetMemberIncomeId: null,
        },
        {
          id: "r2",
          date: "2026-11-10",
          type: "receita" as const,
          selected: true,
          linkedExpenseId: null,
          createdExpenseId: null,
          targetMemberIncomeId: "inc-1",
        },
        {
          id: "r3",
          date: "2026-10-20",
          type: "salario" as const,
          selected: true,
          linkedExpenseId: null,
          createdExpenseId: null,
          targetMemberIncomeId: "inc-2",
        },
        {
          id: "r4",
          date: "2026-11-12",
          type: "despesa" as const,
          selected: true,
          linkedExpenseId: null,
          createdExpenseId: "exp-new-1",
          targetMemberIncomeId: null,
        },
      ];

      // 1. select createdExpenses
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCreatedExpenses),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. select importRows
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockRows),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const summary = await getBatchSummary("fam_1", "b_test");
      expect(summary.batchId).toBe("b_test");
      expect(summary.expensesByMonth).toEqual([
        { month: "2026-10", count: 1 },
        { month: "2026-11", count: 2 },
      ]);
      expect(summary.linkedCount).toBe(1);
      expect(summary.incomesCount).toBe(2);
      expect(summary.incomeMonths).toEqual(["2026-11", "2026-10"]);
      expect(summary.duplicatesCount).toBe(0);
    });

    it("retorna resumo vazio quando o lote não gerou despesas ou receitas", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const summary = await getBatchSummary("fam_1", "b_empty");
      expect(summary.batchId).toBe("b_empty");
      expect(summary.expensesByMonth).toEqual([]);
      expect(summary.linkedCount).toBe(0);
      expect(summary.incomesCount).toBe(0);
      expect(summary.incomeMonths).toEqual([]);
      expect(summary.duplicatesCount).toBe(0);
    });

    it("computa duplicatesCount no resumo a partir de importRows", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const mockRowsWithDup = [
        {
          id: "r1",
          date: "2026-11-05",
          type: "despesa" as const,
          situation: "duplicada" as const,
          selected: true,
          linkedExpenseId: null,
          createdExpenseId: null,
          targetMemberIncomeId: null,
        },
      ];

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockRowsWithDup),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const summary = await getBatchSummary("fam_1", "b_dup");
      expect(summary.duplicatesCount).toBe(1);
    });
  });

  describe("getConfirmedIncomeFingerprints", () => {
    it("retorna Set vazio imediatamente se candidateFingerprints for array vazio", async () => {
      const result = await getConfirmedIncomeFingerprints("fam_1", []);
      expect(result.size).toBe(0);
      expect(db.select).not.toHaveBeenCalled();
    });

    it("retorna Set com fingerprints de lotes confirmados da família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { fingerprint: "fp-inc-1" },
              { fingerprint: "fp-inc-2" },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await getConfirmedIncomeFingerprints("fam_1", ["fp-inc-1", "fp-inc-2", "fp-inc-3"]);
      expect(result.size).toBe(2);
      expect(result.has("fp-inc-1")).toBe(true);
      expect(result.has("fp-inc-2")).toBe(true);
      expect(result.has("fp-inc-3")).toBe(false);
    });
  });
});
