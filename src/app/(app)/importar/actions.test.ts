import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  requireMember: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/lib/period", async () => {
  const actual = await vi.importActual<typeof import("@/lib/period")>("@/lib/period");
  return {
    ...actual,
    assertMonthOpen: vi.fn().mockResolvedValue(undefined),
  };
});

const { mockDb, createDbChain } = vi.hoisted(() => {
  function createDbChain(resolvedValue: unknown = []) {
    const chain: Record<string, unknown> = {};
    const fn = () => chain;

    chain.from = vi.fn(fn);
    chain.innerJoin = vi.fn(fn);
    chain.leftJoin = vi.fn(fn);
    chain.where = vi.fn(fn);
    chain.orderBy = vi.fn(fn);
    chain.limit = vi.fn(fn);
    chain.offset = vi.fn(fn);
    chain.values = vi.fn(fn);
    chain.set = vi.fn(fn);
    chain.returning = vi.fn(() => Promise.resolve(resolvedValue));
    chain.then = (
      resolve: (val: unknown) => unknown,
      reject: (err: unknown) => unknown,
    ) => Promise.resolve(resolvedValue).then(resolve, reject);
    chain.catch = (reject: (err: unknown) => unknown) =>
      Promise.resolve(resolvedValue).catch(reject);

    return chain;
  }

  type MockDb = {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };

  const mockDb: MockDb = {
    select: vi.fn(() => createDbChain([])),
    insert: vi.fn(() => createDbChain([])),
    update: vi.fn(() => createDbChain([])),
    delete: vi.fn(() => createDbChain([])),
    transaction: vi.fn(async (callback: (tx: MockDb) => Promise<unknown>) => {
      return callback(mockDb);
    }),
  };

  return { mockDb, createDbChain };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

import { assertMonthOpen } from "@/lib/period";
import { requireMember, requireRole } from "@/lib/session";
import {
  clearTransferSuggestion,
  confirmBatch,
  createRuleFromRow,
  deleteRule,
  saveMapping,
  saveRule,
  setRowLink,
  undoBatch,
  updateRows,
  uploadStatement,
} from "./actions";

describe("importar actions", () => {
  const famId = "a0000000-0000-4000-8000-000000000001";
  const memberId = "b0000000-0000-4000-8000-000000000001";
  const otherMemberId = "b0000000-0000-4000-8000-000000000002";
  const batchId = "c0000000-0000-4000-8000-000000000001";
  const rowId1 = "d0000000-0000-4000-8000-000000000001";
  const rowId2 = "d0000000-0000-4000-8000-000000000002";
  const categoryId = "e0000000-0000-4000-8000-000000000001";
  const pmId = "f0000000-0000-4000-8000-000000000001";
  const ruleId = "a1111111-0000-4000-8000-000000000001";
  const expenseId = "b1111111-0000-4000-8000-000000000001";
  const mappingId = "c1111111-0000-4000-8000-000000000001";

  let userCounter = 0;
  function getNextUserId() {
    userCounter += 1;
    return `usr_test_${Date.now()}_${userCounter}`;
  }

  function makeMemberSession(userId = getNextUserId()) {
    return {
      user: { id: userId, email: `${userId}@exemplo.com` },
      member: {
        id: memberId,
        familyId: famId,
        role: "membro" as const,
        displayName: "Membro 1",
      },
      familyId: famId,
      role: "membro" as const,
    };
  }

  function makeAdminSession(userId = getNextUserId()) {
    return {
      user: { id: userId, email: `${userId}@exemplo.com` },
      member: {
        id: memberId,
        familyId: famId,
        role: "admin" as const,
        displayName: "Admin",
      },
      familyId: famId,
      role: "admin" as const,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReset();
    mockDb.insert.mockReset();
    mockDb.update.mockReset();
    mockDb.delete.mockReset();
    mockDb.transaction.mockReset();

    mockDb.select.mockImplementation(() => createDbChain([]));
    mockDb.insert.mockImplementation(() => createDbChain([{ id: "default_id", lineNo: 1 }]));
    mockDb.update.mockImplementation(() => createDbChain([]));
    mockDb.delete.mockImplementation(() => createDbChain([]));
    mockDb.transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb),
    );

    vi.mocked(requireMember).mockResolvedValue(
      makeMemberSession() as unknown as Awaited<ReturnType<typeof requireMember>>,
    );
    vi.mocked(requireRole).mockResolvedValue(
      makeAdminSession() as unknown as Awaited<ReturnType<typeof requireRole>>,
    );
  });

  describe("uploadStatement", () => {
    it("rejeita chamada sem arquivo", async () => {
      const fd = new FormData();
      fd.append("paymentMethodId", pmId);
      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/não fornecido/);
      }
    });

    it("rejeita arquivo com mais de 5 MB", async () => {
      const fd = new FormData();
      const largeContent = new Uint8Array(5 * 1024 * 1024 + 10);
      const file = new File([largeContent], "extrato.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/5 MB/);
      }
    });

    it("rejeita arquivo com 0 linhas válidas", async () => {
      const fd = new FormData();
      const emptyFile = new File(["   \n  \n"], "vazio.csv", { type: "text/csv" });
      fd.append("file", emptyFile);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "conta", archived: false }]),
      );

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/Nenhum lançamento válido/);
      }
    });

    it("rejeita forma de pagamento não encontrada na família", async () => {
      const fd = new FormData();
      const file = new File(["Data,Valor,Identificador,Descrição\n01/11/2026,-50.00,x,Mercado"], "extrato.csv", {
        type: "text/csv",
      });
      fd.append("file", file);
      fd.append("paymentMethodId", "pm-inexistente");
      fd.append("ownerMemberId", memberId);

      mockDb.select.mockReturnValueOnce(createDbChain([]));

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/Forma de pagamento não encontrada/);
      }
    });

    it("rejeita forma de pagamento arquivada", async () => {
      const fd = new FormData();
      const file = new File(["Data,Valor,Identificador,Descrição\n01/11/2026,-50.00,x,Mercado"], "extrato.csv", {
        type: "text/csv",
      });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "cartao", archived: true }]),
      );

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/arquivada/);
      }
    });

    it("rejeita forma de pagamento que não seja cartão ou conta (ex: pix ou dinheiro)", async () => {
      const fd = new FormData();
      const file = new File(["Data,Valor,Identificador,Descrição\n01/11/2026,-50.00,x,Mercado"], "extrato.csv", {
        type: "text/csv",
      });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "pix", archived: false }]),
      );

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/cartão ou conta/);
      }
    });

    it("impede membro comum de importar para outro membro", async () => {
      const fd = new FormData();
      const file = new File(["Data,Valor,Identificador,Descrição\n01/11/2026,-50.00,x,Mercado"], "nubank.csv", {
        type: "text/csv",
      });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", otherMemberId);

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "error" in res) {
        expect(res.error).toMatch(/Apenas administradores podem importar para a Família ou outros membros/);
      }
    });

    it("permite admin importar para a família (ownerMemberId: null)", async () => {
      vi.mocked(requireMember).mockResolvedValueOnce(
        makeAdminSession() as unknown as Awaited<ReturnType<typeof requireMember>>,
      );

      const fd = new FormData();
      const nubankCsv = "Data,Valor,Identificador,Descrição\n01/11/2026,-50.00,id-1,Mercado";
      const file = new File([nubankCsv], "nubank.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", "familia");

      // 1. paymentMethods
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "cartao", archived: false }]),
      );
      // 2. rules
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 3. family members
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
      // 4. existing fingerprints
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 5. pending expenses
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // tx.insert importBatches & importRows
      mockDb.insert.mockReturnValue(createDbChain([{ id: batchId, lineNo: 1 }]));

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.batchId).toBe(batchId);
      }
    });

    it("retorna needsMapping: true quando layout for desconhecido e não houver modelo", async () => {
      const unknownCsv = "Data Operacao,Historico,Total\n2026-11-01,Padaria,15.00";
      const fd = new FormData();
      const file = new File([unknownCsv], "desconhecido.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      // paymentMethod existe
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "conta", archived: false }]),
      );

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(false);
      if (!res.ok && "needsMapping" in res) {
        expect(res.needsMapping).toBe(true);
        expect(res.headers).toEqual(["Data Operacao", "Historico", "Total"]);
        expect(res.sample.length).toBeGreaterThan(0);
      }
    });

    it("processa com sucesso arquivo com layout reconhecido (Nubank) e realiza limpeza oportunista", async () => {
      const nubankCsv = "Data,Valor,Identificador,Descrição\n01/11/2026,-42.50,id-123,Supermercado";
      const fd = new FormData();
      const file = new File([nubankCsv], "nubank.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      // 1. paymentMethod existe
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "cartao", archived: false }]),
      );
      // 2. regras existentes
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 3. membros da família
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
      // 4. despesas existentes para fingerprint/duplicidade
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 5. despesas pendentes para match
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // tx.insert batch e rows
      mockDb.insert.mockReturnValue(createDbChain([{ id: batchId, lineNo: 1 }]));

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.batchId).toBe(batchId);
      }
      expect(mockDb.delete).toHaveBeenCalled(); // Limpeza oportunista de rascunhos antigos (>30d)
    });

    it("bloqueia upload quando rate limit (10 arquivos em 10 min) é excedido", async () => {
      const dedicatedUserId = getNextUserId();
      vi.mocked(requireMember).mockResolvedValue(
        makeMemberSession(dedicatedUserId) as unknown as Awaited<ReturnType<typeof requireMember>>,
      );

      // Executa 10 uploads
      for (let i = 0; i < 10; i++) {
        const fd = new FormData();
        const file = new File([`Data,Valor,Identificador,Descrição\n01/11/2026,-10.00,id-${i},Compra`], "nubank.csv", {
          type: "text/csv",
        });
        fd.append("file", file);
        fd.append("paymentMethodId", pmId);
        fd.append("ownerMemberId", memberId);

        mockDb.select.mockReturnValueOnce(
          createDbChain([{ id: pmId, type: "cartao", archived: false }]),
        );
        mockDb.select.mockReturnValueOnce(createDbChain([]));
        mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
        mockDb.select.mockReturnValueOnce(createDbChain([]));
        mockDb.select.mockReturnValueOnce(createDbChain([]));
        mockDb.insert.mockReturnValue(createDbChain([{ id: batchId, lineNo: 1 }]));

        const res = await uploadStatement(fd);
        expect(res.ok).toBe(true);
      }

      // 11º upload deve ser bloqueado pelo rate limit
      const fd11 = new FormData();
      const file11 = new File(["Data,Valor,Identificador,Descrição\n01/11/2026,-10.00,id-11,Compra"], "nubank.csv", {
        type: "text/csv",
      });
      fd11.append("file", file11);
      fd11.append("paymentMethodId", pmId);
      fd11.append("ownerMemberId", memberId);

      const res11 = await uploadStatement(fd11);
      expect(res11.ok).toBe(false);
      if (!res11.ok && "error" in res11) {
        expect(res11.error).toMatch(/Limite de uploads atingido/);
      }
    });

    it("detecta despesa manual no mesmo dia com mesmo valor e forma como duplicada (desmarcada)", async () => {
      const manualExpenseId = "e1111111-0000-4000-8000-000000000099";
      const nubankCsv = "Data,Valor,Identificador,Descrição\n01/11/2026,-42.50,id-123,Supermercado";
      const fd = new FormData();
      const file = new File([nubankCsv], "nubank.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      // 1. paymentMethod existe
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "cartao", archived: false }]),
      );
      // 2. regras existentes
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 3. membros da família
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
      // 4. despesas existentes para fingerprint (vazio)
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 5. despesas pendentes para match (vazio)
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 6. despesas candidatas do mesmo dia (despesa manual com due_date 2026-11-01)
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: manualExpenseId,
            amountCents: 4250,
            dueDate: "2026-11-01",
            paidAt: null,
            paymentMethodId: pmId,
          },
        ]),
      );

      let insertedRowsPayload:
        | Array<{
            situation: string;
            selected: boolean;
            matchedExpenseId: string | null;
          }>
        | undefined;

      mockDb.insert.mockImplementation(() => {
        const chain = createDbChain([{ id: batchId, lineNo: 1 }]);
        const origValues = chain.values as (val: unknown) => unknown;
        chain.values = vi.fn((val: unknown) => {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "situation" in val[0]) {
            insertedRowsPayload = val as Array<{
              situation: string;
              selected: boolean;
              matchedExpenseId: string | null;
            }>;
          }
          return origValues(val);
        });
        return chain;
      });

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(true);
      expect(insertedRowsPayload).toBeDefined();
      expect(insertedRowsPayload?.[0]?.situation).toBe("duplicada");
      expect(insertedRowsPayload?.[0]?.selected).toBe(false);
      expect(insertedRowsPayload?.[0]?.matchedExpenseId).toBe(manualExpenseId);
    });

    it("detecta despesa manual pelo dia de paidAt no fuso America/Araguaina", async () => {
      const manualExpenseId = "e1111111-0000-4000-8000-000000000098";
      // Transação do extrato em 01/11/2026
      const nubankCsv = "Data,Valor,Identificador,Descrição\n01/11/2026,-75.00,id-456,Restaurante";
      const fd = new FormData();
      const file = new File([nubankCsv], "nubank.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", pmId);
      fd.append("ownerMemberId", memberId);

      // Despesa manual com vencimento em outubro mas paga no dia 01/11/2026 às 15:00 UTC (12:00 Araguaina)
      const paidAtDate = new Date("2026-11-01T15:00:00Z");

      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "cartao", archived: false }]),
      );
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: manualExpenseId,
            amountCents: 7500,
            dueDate: "2026-10-25", // Due date diferente
            paidAt: paidAtDate, // Mas paidAt bate no dia 2026-11-01 no fuso
            paymentMethodId: pmId,
          },
        ]),
      );

      let insertedRowsPayload:
        | Array<{
            situation: string;
            selected: boolean;
            matchedExpenseId: string | null;
          }>
        | undefined;

      mockDb.insert.mockImplementation(() => {
        const chain = createDbChain([{ id: batchId, lineNo: 1 }]);
        const origValues = chain.values as (val: unknown) => unknown;
        chain.values = vi.fn((val: unknown) => {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "situation" in val[0]) {
            insertedRowsPayload = val as Array<{
              situation: string;
              selected: boolean;
              matchedExpenseId: string | null;
            }>;
          }
          return origValues(val);
        });
        return chain;
      });

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(true);
      expect(insertedRowsPayload).toBeDefined();
      expect(insertedRowsPayload?.[0]?.situation).toBe("duplicada");
      expect(insertedRowsPayload?.[0]?.selected).toBe(false);
      expect(insertedRowsPayload?.[0]?.matchedExpenseId).toBe(manualExpenseId);
    });

    it("concilia com despesa manual pendente calculando cardInvoice.dueDate quando lote é cartão com fechamento/vencimento", async () => {
      const cardPmId = "card-pm-concilia";
      const manualExpenseId = "exp-manual-pendente-123";

      const cardCsv = "Data,Valor,Identificador,Descrição\n10/05/2026,-150.00,id-card-1,Eletrônicos";
      const fd = new FormData();
      const file = new File([cardCsv], "fatura.csv", { type: "text/csv" });
      fd.append("file", file);
      fd.append("paymentMethodId", cardPmId);
      fd.append("ownerMemberId", memberId);

      // 1. paymentMethods: cartão fecha 5, vence 15
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: cardPmId,
            type: "cartao",
            closingDay: 5,
            dueDay: 15,
            archived: false,
          },
        ]),
      );
      // 2. regras
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 3. membros da família
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: memberId, displayName: "Membro 1" }]));
      // 4. fingerprints existentes
      mockDb.select.mockReturnValueOnce(createDbChain([]));
      // 5. despesas pendentes: despesa manual pendente com vencimento 2026-06-15 e mês 2026-06-01
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: manualExpenseId,
            amountCents: 15000,
            dueDate: "2026-06-15",
            month: "2026-06-01",
          },
        ]),
      );
      // 6. despesas candidatas do mesmo dia (vazio)
      mockDb.select.mockReturnValueOnce(createDbChain([]));

      let insertedRowsPayload:
        | Array<{
            situation: string;
            matchedExpenseId: string | null;
          }>
        | undefined;

      mockDb.insert.mockImplementation(() => {
        const chain = createDbChain([{ id: batchId, lineNo: 1 }]);
        const origValues = chain.values as (val: unknown) => unknown;
        chain.values = vi.fn((val: unknown) => {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "situation" in val[0]) {
            insertedRowsPayload = val as Array<{
              situation: string;
              matchedExpenseId: string | null;
            }>;
          }
          return origValues(val);
        });
        return chain;
      });

      const res = await uploadStatement(fd);
      expect(res.ok).toBe(true);
      expect(insertedRowsPayload).toBeDefined();
      expect(insertedRowsPayload?.[0]?.situation).toBe("possivel_vinculo");
      expect(insertedRowsPayload?.[0]?.matchedExpenseId).toBe(manualExpenseId);
    });
  });

  describe("saveMapping", () => {
    it("valida e salva um modelo de extrato", async () => {
      mockDb.insert.mockReturnValueOnce(createDbChain([{ id: mappingId }]));

      const res = await saveMapping({
        name: "Banco X",
        config: {
          separator: ",",
          headerSignature: ["Data", "Lancamento", "Valor"],
          dateColumn: "Data",
          dateFormat: "dd/mm/yyyy",
          descriptionColumns: ["Lancamento"],
          amountColumn: "Valor",
          decimal: ",",
        },
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.mappingId).toBe(mappingId);
      }
    });

    it("rejeita entrada com nome vazio", async () => {
      const res = await saveMapping({
        name: "",
        config: {
          separator: ",",
          headerSignature: ["Data", "Lancamento", "Valor"],
          dateColumn: "Data",
          dateFormat: "dd/mm/yyyy",
          descriptionColumns: ["Lancamento"],
          amountColumn: "Valor",
          decimal: ",",
        },
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Nome não pode ser vazio/);
      }
    });
  });

  describe("updateRows", () => {
    it("rejeita se o lote não estiver em rascunho", async () => {
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "confirmado" }]));

      const res = await updateRows({
        batchId,
        rowIds: [rowId1],
        patch: { selected: false },
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/rascunho/);
      }
    });

    it("atualiza linhas selecionadas com categoria e tipo", async () => {
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "rascunho" }]));

      const res = await updateRows({
        batchId,
        rowIds: [rowId1, rowId2],
        patch: {
          categoryId,
          type: "despesa",
          selected: true,
        },
      });

      expect(res.ok).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("setRowLink", () => {
    it("vincula linha a despesa pendente", async () => {
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "rascunho" }]));

      const res = await setRowLink({
        batchId,
        rowId: rowId1,
        expenseId,
      });

      expect(res.ok).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("desvincula despesa passando null", async () => {
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "rascunho" }]));

      const res = await setRowLink({
        batchId,
        rowId: rowId1,
        expenseId: null,
      });

      expect(res.ok).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("clearTransferSuggestion", () => {
    it("desfaz vínculo de transferência entre contas", async () => {
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "rascunho" }]));
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            linkedRowId: rowId2,
            amountCents: -5000,
          },
        ]),
      );

      const res = await clearTransferSuggestion(batchId, rowId1);
      expect(res.ok).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("createRuleFromRow", () => {
    it("impede membro comum de criar regra (somente admin/dono)", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(
        new Error("Acesso negado: papel \"membro\" insuficiente para o mínimo \"admin\"."),
      );

      const res = await createRuleFromRow({
        batchId,
        rowId: rowId1,
        matchType: "contem",
        pattern: "UBER",
        categoryId,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/insuficiente/);
      }
    });

    it("permite admin criar regra e aplica às linhas do lote", async () => {
      mockDb.insert.mockReturnValueOnce(createDbChain([{ id: ruleId }]));
      mockDb.select.mockReturnValueOnce(createDbChain([{ status: "rascunho" }]));
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            descriptionNormalized: "UBER TRIP",
            categoryId: null,
            ownerMemberId: null,
            paymentMethodId: null,
          },
        ]),
      );

      const res = await createRuleFromRow({
        batchId,
        rowId: rowId1,
        matchType: "contem",
        pattern: "UBER",
        categoryId,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.ruleId).toBe(ruleId);
      }
    });
  });

  describe("saveRule e deleteRule", () => {
    it("salva regra nova como admin", async () => {
      mockDb.insert.mockReturnValueOnce(createDbChain([{ id: ruleId }]));

      const res = await saveRule({
        matchType: "contem",
        pattern: "IFOOD",
        categoryId,
        priority: 1,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.ruleId).toBe(ruleId);
      }
    });

    it("atualiza regra existente como admin", async () => {
      mockDb.update.mockReturnValueOnce(createDbChain([{ id: ruleId }]));

      const res = await saveRule({
        id: ruleId,
        matchType: "comeca",
        pattern: "IFOOD *",
        categoryId,
        priority: 2,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.ruleId).toBe(ruleId);
      }
    });

    it("exclui regra como admin", async () => {
      mockDb.delete.mockReturnValueOnce(createDbChain([{ id: ruleId }]));

      const res = await deleteRule(ruleId);
      expect(res.ok).toBe(true);
    });
  });

  describe("confirmBatch", () => {
    it("é idempotente: retorna ok se o lote já estiver confirmado", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "confirmado",
          },
        ]),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.batchId).toBe(batchId);
      }
    });

    it("rejeita confirmação se lote já tiver sido desfeito", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "desfeito",
          },
        ]),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/desfeito/);
      }
    });

    it("rejeita confirmação se nenhuma linha estiver selecionada", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(createDbChain([]));

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Nenhum lançamento selecionado/);
      }
    });

    it("bloqueia confirmação se despesa selecionada não tiver categoria", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            categoryId: null, // Sem categoria
            date: "2026-11-05",
            amountCents: -5000,
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "conta", archived: false }]),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Todas as despesas selecionadas devem ter uma categoria definida/);
      }
    });

    it("bloqueia confirmação se receita selecionada não tiver membro", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "receita",
            categoryId: null,
            ownerMemberId: null, // Sem membro atribuído
            date: "2026-11-05",
            amountCents: 15000,
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ id: pmId, type: "conta", archived: false }]),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Receitas e salários devem ser atribuídos a um membro/);
      }
    });

    it("bloqueia confirmação se a forma de pagamento do lote não for encontrada na família", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            paymentMethodId: pmId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            categoryId,
            date: "2026-11-05",
            amountCents: -5000,
          },
        ]),
      );
      // Forma não encontrada
      mockDb.select.mockReturnValueOnce(createDbChain([]));

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Forma de pagamento não encontrada/);
      }
    });

    it("bloqueia confirmação se a forma de pagamento do lote tiver sido arquivada", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            paymentMethodId: pmId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            categoryId,
            date: "2026-11-05",
            amountCents: -5000,
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: pmId,
            type: "cartao",
            archived: true,
          },
        ]),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/arquivada/);
      }
    });

    it("bloqueia confirmação se o mês da linha estiver fechado", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            status: "rascunho",
          },
        ]),
      );
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            categoryId,
            date: "2026-10-15",
            amountCents: -5000,
          },
        ]),
      );
      // batchPaymentMethod
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: pmId, type: "conta" }]));

      vi.mocked(assertMonthOpen).mockRejectedValueOnce(
        new Error("O mês 2026-10 está fechado para edição."),
      );

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/fechado para edição/);
      }
    });

    it("confirma lote transacionalmente: cria despesas, atualiza receitas e salários", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            paymentMethodId: pmId,
            status: "rascunho",
          },
        ]),
      );

      const rowsToConfirm = [
        // Despesa nova
        {
          id: rowId1,
          date: "2026-11-05",
          descriptionOriginal: "Supermercado",
          amountCents: -8000,
          type: "despesa",
          categoryId,
          ownerMemberId: memberId,
          paymentMethodId: pmId,
          linkedExpenseId: null,
          fingerprint: "fp123",
        },
        // Receita extra
        {
          id: rowId2,
          date: "2026-11-06",
          descriptionOriginal: "Venda Usado",
          amountCents: 20000,
          type: "receita",
          categoryId: null,
          ownerMemberId: memberId,
          paymentMethodId: pmId,
          linkedExpenseId: null,
          fingerprint: "fp124",
        },
      ];

      mockDb.select.mockReturnValueOnce(createDbChain(rowsToConfirm));
      // batchPaymentMethod
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: pmId, type: "conta" }]));

      // Dentro da transação:
      // 1. insert despesa
      mockDb.insert.mockReturnValueOnce(createDbChain([{ id: expenseId }]));
      // 2. select monthlyPeriods
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: "period_nov" }]));
      // 3. select memberIncomes
      mockDb.select.mockReturnValueOnce(createDbChain([{ id: "inc_1", extraCents: 10000 }]));

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.batchId).toBe(batchId);
      }
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it("aplica regra de fatura (cardInvoice) ao confirmar importação com cartão que possui fechamento e vencimento", async () => {
      const cardPmId = "card-pm-123";
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            paymentMethodId: cardPmId,
            status: "rascunho",
          },
        ]),
      );

      const rowsToConfirm = [
        // Compra no dia 10/05 (fecha dia 5, vence 15 -> fatura de junho: ref 2026-06-01, due 2026-06-15)
        {
          id: rowId1,
          date: "2026-05-10",
          descriptionOriginal: "Restaurante",
          amountCents: -12000,
          type: "despesa",
          categoryId,
          ownerMemberId: memberId,
          paymentMethodId: cardPmId,
          linkedExpenseId: null,
          fingerprint: "fp-card-1",
        },
        // Compra no dia 03/05 (fecha dia 5, vence 15 -> fatura de maio: ref 2026-05-01, due 2026-05-15)
        {
          id: rowId2,
          date: "2026-05-03",
          descriptionOriginal: "Café",
          amountCents: -1500,
          type: "despesa",
          categoryId,
          ownerMemberId: memberId,
          paymentMethodId: cardPmId,
          linkedExpenseId: null,
          fingerprint: "fp-card-2",
        },
      ];

      // 1. selectedRows
      mockDb.select.mockReturnValueOnce(createDbChain(rowsToConfirm));
      // 2. batchPaymentMethod (cartão com fechamento 5 e vencimento 15)
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: cardPmId,
            type: "cartao",
            closingDay: 5,
            dueDay: 15,
            archived: false,
          },
        ]),
      );

      const insertedExpenses: Array<Record<string, unknown>> = [];
      mockDb.insert.mockImplementation(() => {
        const chain = createDbChain([{ id: "new-exp-id" }]);
        chain.values = vi.fn((val: unknown) => {
          if (typeof val === "object" && val !== null) {
            insertedExpenses.push(val as Record<string, unknown>);
          }
          return chain;
        });
        return chain;
      });

      const res = await confirmBatch(batchId);
      expect(res.ok).toBe(true);

      // Confirma que foram criadas 2 despesas com a regra de fatura aplicada
      expect(insertedExpenses).toHaveLength(2);

      // Primeira despesa (compra 10/05): referenceMonth 2026-06-01, dueDate 2026-06-15, paymentMethodId = batch.paymentMethodId
      expect(insertedExpenses[0]).toMatchObject({
        referenceMonth: "2026-06-01",
        dueDate: "2026-06-15",
        paymentMethodId: cardPmId,
        amountCents: 12000,
        status: "pago",
      });

      // Segunda despesa (compra 03/05): referenceMonth 2026-05-01, dueDate 2026-05-15, paymentMethodId = batch.paymentMethodId
      expect(insertedExpenses[1]).toMatchObject({
        referenceMonth: "2026-05-01",
        dueDate: "2026-05-15",
        paymentMethodId: cardPmId,
        amountCents: 1500,
        status: "pago",
      });

      // Meses checados com assertMonthOpen devem ser 2026-06 e 2026-05
      expect(assertMonthOpen).toHaveBeenCalledWith(famId, "2026-06");
      expect(assertMonthOpen).toHaveBeenCalledWith(famId, "2026-05");
    });
  });

  describe("undoBatch", () => {
    it("impede outro membro comum que não é o importador de desfazer o lote", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: otherMemberId, // Importado por outro membro
            status: "confirmado",
          },
        ]),
      );

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Apenas quem importou o lote ou administradores podem desfazê-lo/);
      }
    });

    it("rejeita desfazer lote que não está com status confirmado", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: memberId,
            status: "rascunho",
          },
        ]),
      );

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/Apenas lotes confirmados podem ser desfeitos/);
      }
    });

    it("bloqueia desfazer se o mês das despesas estiver fechado", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: memberId,
            status: "confirmado",
          },
        ]),
      );

      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            date: "2026-10-10",
            linkedExpenseId: null,
          },
        ]),
      );

      // createdExpenses
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ referenceMonth: "2026-10-01" }]),
      );

      vi.mocked(assertMonthOpen).mockRejectedValueOnce(
        new Error("O mês 2026-10 está fechado para edição."),
      );

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/fechado para edição/);
      }
    });

    it("bloqueia desfazer quando a fatura de cartão de crédito cai num mês fechado", async () => {
      const cardPmId = "card-pm-closing-test";
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: memberId,
            paymentMethodId: cardPmId,
            status: "confirmado",
          },
        ]),
      );

      // Compra feita em 10/05 (maio), mas cuja despesa gravada tem referenceMonth de junho (2026-06-01)
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            date: "2026-05-10",
            linkedExpenseId: null,
          },
        ]),
      );

      // createdExpenses gravadas no banco com o referenceMonth da fatura
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            referenceMonth: "2026-06-01",
          },
        ]),
      );

      // Mês da fatura (2026-06) está fechado
      vi.mocked(assertMonthOpen).mockImplementation(async (_famId, monthKey) => {
        if (monthKey === "2026-06") {
          throw new Error("O mês 2026-06 está fechado para edição.");
        }
      });

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/2026-06 está fechado/);
      }
      expect(assertMonthOpen).toHaveBeenCalledWith(famId, "2026-06");
    });

    it("bloqueia desfazer quando o dia de fechamento do cartão é alterado após importação mas o mês gravado está fechado (não recalcula fatura)", async () => {
      // Simula um lote cujo cartão sofreu alteração no dia de fechamento após a importação.
      // O desfazer deve respeitar estritamente o referenceMonth gravado no banco nas despesas,
      // sem consultar a forma de pagamento nem recalcular cardInvoice.
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: memberId,
            paymentMethodId: "card-pm-changed",
            status: "confirmado",
          },
        ]),
      );

      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            type: "despesa",
            date: "2026-05-28", // se recalculasse com fechamento dia 25 viraria junho, se dia 30 viraria maio
            linkedExpenseId: null,
          },
        ]),
      );

      // Despesa gravada na época da importação com referenceMonth de junho (2026-06-01)
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            referenceMonth: "2026-06-01",
          },
        ]),
      );

      vi.mocked(assertMonthOpen).mockImplementation(async (_famId, monthKey) => {
        if (monthKey === "2026-06") {
          throw new Error("O mês 2026-06 está fechado para edição.");
        }
      });

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toMatch(/2026-06 está fechado para edição/);
      }
      // Garante que validou pelo mês gravado (2026-06), sem recalcular pela data da compra (2026-05)
      expect(assertMonthOpen).toHaveBeenCalledWith(famId, "2026-06");
      expect(assertMonthOpen).not.toHaveBeenCalledWith(famId, "2026-05");
    });

    it("desfaz lote com sucesso: exclusão lógica de despesas e reversão de receitas", async () => {
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: batchId,
            importedBy: memberId,
            status: "confirmado",
          },
        ]),
      );

      // Linhas com despesa vinculada e receita aplicada
      mockDb.select.mockReturnValueOnce(
        createDbChain([
          {
            id: rowId1,
            date: "2026-11-05",
            linkedExpenseId: expenseId,
            targetMemberIncomeId: null,
            appliedExtraCents: null,
            previousSalaryCents: null,
          },
          {
            id: rowId2,
            date: "2026-11-06",
            linkedExpenseId: null,
            targetMemberIncomeId: "inc_1",
            appliedExtraCents: 20000,
            previousSalaryCents: null,
          },
        ]),
      );

      // createdExpenses
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ referenceMonth: "2026-11-01" }]),
      );
      // linkedExpenses (para expenseId)
      mockDb.select.mockReturnValueOnce(
        createDbChain([{ referenceMonth: "2026-11-01" }]),
      );

      // select currentInc na reversão
      mockDb.select.mockReturnValueOnce(createDbChain([{ extraCents: 30000 }]));

      const res = await undoBatch(batchId);
      expect(res.ok).toBe(true);
      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });
});
