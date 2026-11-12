import { describe, expect, it } from "vitest";
import {
  applyRules,
  findOwnTransfers,
  matchStatus,
  suggestType,
} from "./classify";
import type { ClassificationRule, ParsedRow } from "./types";

describe("classify", () => {
  const createMockRow = (partial: Partial<ParsedRow>): ParsedRow => ({
    lineNo: 1,
    date: "2026-11-05",
    descriptionOriginal: "Padaria do Bairro",
    descriptionNormalized: "PADARIA DO BAIRRO",
    amountCents: -2500,
    ...partial,
  });

  describe("applyRules", () => {
    it("aplica regra por 'contem' com prioridade mais alta primeiro", () => {
      const row = createMockRow({ descriptionNormalized: "POSTO IPIRANGA COMBUSTIVEL" });

      const rules: ClassificationRule[] = [
        {
          matchType: "contem",
          pattern: "POSTO",
          categoryId: "cat_transporte_baixa",
          priority: 1,
        },
        {
          matchType: "contem",
          pattern: "IPIRANGA",
          categoryId: "cat_transporte_alta",
          priority: 10,
        },
      ];

      const match = applyRules(row, rules);
      expect(match).toEqual({
        categoryId: "cat_transporte_alta",
        ownerId: null,
        paymentMethodId: null,
        displayName: null,
      });
    });

    it("devolve o nome salvo na regra para renomear o lançamento", () => {
      const row = createMockRow({ descriptionNormalized: "PIX QR CODE ESTATICO" });
      const rules: ClassificationRule[] = [
        {
          matchType: "contem",
          pattern: "PIX QR CODE ESTATICO",
          categoryId: "cat_cartoes",
          displayName: "  Fatura Nubank  ",
        },
      ];
      expect(applyRules(row, rules)?.displayName).toBe("Fatura Nubank");
    });

    it("aplica regra por 'comeca'", () => {
      const row = createMockRow({ descriptionNormalized: "UBER TRIP SAO PAULO" });

      const rules: ClassificationRule[] = [
        {
          matchType: "comeca",
          pattern: "UBER",
          categoryId: "cat_uber",
        },
      ];

      const match = applyRules(row, rules);
      expect(match?.categoryId).toBe("cat_uber");
    });

    it("retorna null quando nenhuma regra coincide", () => {
      const row = createMockRow({ descriptionNormalized: "FARMACIA PRECO BAIXO" });
      const rules: ClassificationRule[] = [
        { matchType: "contem", pattern: "MERCADO", categoryId: "cat_mercado" },
      ];
      expect(applyRules(row, rules)).toBeNull();
    });
  });

  describe("suggestType", () => {
    it("sugere 'ignorar' para pagamento de fatura", () => {
      const row1 = createMockRow({
        descriptionNormalized: "PAGAMENTO DE FATURA CARTAO MASTER",
        amountCents: -150000,
      });
      const res1 = suggestType(row1);
      expect(res1.type).toBe("ignorar");
      expect(res1.ignoreReason).toContain("fatura");

      const row2 = createMockRow({
        descriptionNormalized: "PGTO FATURA INTER",
        amountCents: -80000,
      });
      expect(suggestType(row2).type).toBe("ignorar");
    });

    it("sugere 'salario' para crédito com padrão de remuneração", () => {
      const row = createMockRow({
        descriptionNormalized: "TED C SAL EMPRESA TECNOLOGIA LTDA",
        amountCents: 850000,
      });
      expect(suggestType(row)).toEqual({ type: "salario" });
    });

    it("sugere 'receita' para outros créditos positivos", () => {
      const row = createMockRow({
        descriptionNormalized: "PIX RECEBIDO DE AMIGO",
        amountCents: 5000,
      });
      expect(suggestType(row)).toEqual({ type: "receita" });
    });

    it("sugere 'despesa' para débitos normais negativos", () => {
      const row = createMockRow({
        descriptionNormalized: "SUPERMERCADO PAO DE ACUCAR",
        amountCents: -24590,
      });
      expect(suggestType(row)).toEqual({ type: "despesa" });
    });

    it("sugere 'ignorar' para lançamento com valor zero", () => {
      const row = createMockRow({
        descriptionNormalized: "TARIFA ISENTA",
        amountCents: 0,
      });
      expect(suggestType(row).type).toBe("ignorar");
    });
  });

  describe("findOwnTransfers", () => {
    it("identifica pares de transferência com mesmo valor, sinal oposto e contas diferentes", () => {
      const rows = [
        {
          id: "row_saida",
          paymentMethodId: "conta_bradesco",
          date: "2026-11-05",
          amountCents: -50000,
          descriptionNormalized: "TRANSF PIX PARA LORRANE NUBANK",
        },
        {
          id: "row_entrada",
          paymentMethodId: "conta_nubank",
          date: "2026-11-05",
          amountCents: 50000,
          descriptionNormalized: "PIX RECEBIDO DE JEFFERSON BRADESCO",
        },
        {
          id: "row_outra",
          paymentMethodId: "conta_bradesco",
          date: "2026-11-05",
          amountCents: -12000,
          descriptionNormalized: "RESTAURANTE",
        },
      ];

      const memberNames = ["Jefferson", "Lorrane"];
      const pairs = findOwnTransfers(rows, memberNames);

      expect(pairs).toHaveLength(1);
      expect(pairs[0]).toEqual(["row_saida", "row_entrada"]);
    });

    it("aceita até 1 dia de diferença entre saída e entrada", () => {
      const rows = [
        {
          id: "row_a",
          paymentMethodId: "conta_1",
          date: "2026-11-05",
          amountCents: -20000,
          descriptionNormalized: "TED ENVIADA",
        },
        {
          id: "row_b",
          paymentMethodId: "conta_2",
          date: "2026-11-06",
          amountCents: 20000,
          descriptionNormalized: "TED RECEBIDA",
        },
      ];

      const pairs = findOwnTransfers(rows);
      expect(pairs).toEqual([["row_a", "row_b"]]);
    });

    it("não pareia transações com mais de 1 dia de diferença ou na mesma conta", () => {
      const rows = [
        {
          id: "row_a",
          paymentMethodId: "conta_1",
          date: "2026-11-01",
          amountCents: -20000,
          descriptionNormalized: "TRANSF",
        },
        {
          id: "row_b",
          paymentMethodId: "conta_1", // mesma conta
          date: "2026-11-01",
          amountCents: 20000,
          descriptionNormalized: "TRANSF",
        },
        {
          id: "row_c",
          paymentMethodId: "conta_2",
          date: "2026-11-05", // 4 dias de diferença
          amountCents: 20000,
          descriptionNormalized: "TRANSF",
        },
      ];

      const pairs = findOwnTransfers(rows);
      expect(pairs).toHaveLength(0);
    });
  });

  describe("matchStatus", () => {
    it("identifica duplicada quando fingerprint já existe", () => {
      const row = createMockRow({});
      const status = matchStatus(row, {
        existingFingerprints: new Set(["fp_cadastrado"]),
        pendingExpenses: [],
        rowFingerprint: "fp_cadastrado",
      });

      expect(status).toEqual({ situation: "duplicada" });
    });

    it("identifica duplicada quando bate mesma data, mesmo valor e mesma forma de pagamento (sameDayExpenses)", () => {
      const row = createMockRow({
        date: "2026-11-05",
        amountCents: -2500,
      });

      const sameDayExpenses = [
        {
          id: "exp_manual_1",
          amountCents: 2500,
          date: "2026-11-05",
          paymentMethodId: "pm_cartao",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        sameDayExpenses,
        paymentMethodId: "pm_cartao",
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({
        situation: "duplicada",
        matchedExpenseId: "exp_manual_1",
      });
    });

    it("prioriza fingerprint sobre sameDayExpenses quando ambos coincidem", () => {
      const row = createMockRow({
        date: "2026-11-05",
        amountCents: -2500,
      });

      const sameDayExpenses = [
        {
          id: "exp_manual_1",
          amountCents: 2500,
          date: "2026-11-05",
          paymentMethodId: "pm_cartao",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(["fp_duplicada"]),
        sameDayExpenses,
        paymentMethodId: "pm_cartao",
        rowFingerprint: "fp_duplicada",
      });

      expect(status).toEqual({ situation: "duplicada" });
    });

    it("prioriza sameDayExpenses sobre possivel_vinculo quando ambos coincidem", () => {
      const row = createMockRow({
        date: "2026-11-05",
        amountCents: -5000,
      });

      const sameDayExpenses = [
        {
          id: "exp_same_day",
          amountCents: 5000,
          date: "2026-11-05",
          paymentMethodId: "pm_conta",
        },
      ];

      const pendingExpenses = [
        {
          id: "exp_pending",
          amountCents: 5000,
          month: "2026-11",
          dueDate: "2026-11-05",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        sameDayExpenses,
        pendingExpenses,
        paymentMethodId: "pm_conta",
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({
        situation: "duplicada",
        matchedExpenseId: "exp_same_day",
      });
    });

    it("não considera duplicada por sameDayExpenses se a forma de pagamento for diferente", () => {
      const row = createMockRow({
        date: "2026-11-05",
        amountCents: -2500,
      });

      const sameDayExpenses = [
        {
          id: "exp_manual_1",
          amountCents: 2500,
          date: "2026-11-05",
          paymentMethodId: "pm_cartao_a",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        sameDayExpenses,
        paymentMethodId: "pm_cartao_b",
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({ situation: "nova" });
    });

    it("não considera duplicada por sameDayExpenses se a data for diferente", () => {
      const row = createMockRow({
        date: "2026-11-05",
        amountCents: -2500,
      });

      const sameDayExpenses = [
        {
          id: "exp_manual_1",
          amountCents: 2500,
          date: "2026-11-06",
          paymentMethodId: "pm_cartao",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        sameDayExpenses,
        paymentMethodId: "pm_cartao",
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({ situation: "nova" });
    });

    it("identifica possível vínculo com despesa pendente de mesmo valor e vencimento próximo", () => {
      const row = createMockRow({
        date: "2026-11-10",
        amountCents: -18050, // R$ 180,50
      });

      const pendingExpenses = [
        {
          id: "exp_energia",
          amountCents: 18050,
          month: "2026-11",
          dueDate: "2026-11-12",
        },
      ];

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        pendingExpenses,
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({
        situation: "possivel_vinculo",
        matchedExpenseId: "exp_energia",
      });
    });

    it("identifica como nova quando não há duplicidade nem despesa pendente correspondente", () => {
      const row = createMockRow({
        date: "2026-11-10",
        amountCents: -3500,
      });

      const status = matchStatus(row, {
        existingFingerprints: new Set(),
        pendingExpenses: [],
        rowFingerprint: "fp_nova",
      });

      expect(status).toEqual({ situation: "nova" });
    });
  });
});
