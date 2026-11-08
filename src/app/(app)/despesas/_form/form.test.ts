import { describe, expect, it } from "vitest";
import {
  filterAvailablePaymentMethods,
  formatFamilyHint,
  formatInstallmentCaption,
  formatParticipantsText,
  suggestCardDueDateAndMonth,
  validateExpenseForm,
} from "./helpers";

describe("Helpers do Formulário de Despesas (06/tela-lancar-despesa)", () => {
  describe("formatParticipantsText", () => {
    it("trata 0 participantes", () => {
      expect(formatParticipantsText([])).toBe("todos os membros");
    });

    it("trata 1 participante", () => {
      expect(formatParticipantsText(["Jefferson"])).toBe("Jefferson");
    });

    it("trata 2 participantes com 'e'", () => {
      expect(formatParticipantsText(["Jefferson", "Lorrane"])).toBe("Jefferson e Lorrane");
    });

    it("trata 3+ participantes com vírgula e 'e'", () => {
      expect(formatParticipantsText(["Jefferson", "Lorrane", "Filho"])).toBe(
        "Jefferson, Lorrane e Filho"
      );
    });
  });

  describe("formatFamilyHint", () => {
    it("gera o texto do hint idêntico ao protótipo para regra proporcional", () => {
      const hint = formatFamilyHint({
        splitMembers: [{ displayName: "Jefferson" }, { displayName: "Lorrane" }],
        defaultSplitRule: "proporcional",
        currentUserName: "Jefferson",
      });

      expect(hint).toBe(
        '"Família" divide a despesa entre Jefferson e Lorrane, proporcional ao salário. Lançado por Jefferson.'
      );
    });

    it("gera o texto para regra em partes iguais", () => {
      const hint = formatFamilyHint({
        splitMembers: [{ displayName: "Jefferson" }, { displayName: "Lorrane" }],
        defaultSplitRule: "igual",
        currentUserName: "Lorrane",
      });

      expect(hint).toBe(
        '"Família" divide a despesa entre Jefferson e Lorrane, em partes iguais. Lançado por Lorrane.'
      );
    });
  });

  describe("formatInstallmentCaption", () => {
    it("gera a legenda exata do protótipo para parcela 7 de 8 em novembro", () => {
      const caption = formatInstallmentCaption({
        dueDate: "2026-11-03",
        current: 7,
        total: 8,
        amountCents: 108800,
      });

      expect(caption).toBe(
        "Gera a parcela 8 de 8 em dezembro 2026 automaticamente. Comprometido nos próximos meses: R$ 1.088,00."
      );
    });

    it("gera a legenda para múltiplas parcelas futuras (ex: 2 de 5)", () => {
      const caption = formatInstallmentCaption({
        dueDate: "2026-11-10",
        current: 2,
        total: 5,
        amountCents: 10000,
      });

      // 3 parcelas restantes (3, 4, 5) terminando em fevereiro 2027
      // 3 * 100,00 = 300,00
      expect(caption).toBe(
        "Gera as parcelas de 3 a 5 (até fevereiro 2027) automaticamente. Comprometido nos próximos meses: R$ 300,00."
      );
    });

    it("indica que é a última parcela quando current === total", () => {
      const caption = formatInstallmentCaption({
        dueDate: "2026-11-03",
        current: 8,
        total: 8,
        amountCents: 108800,
      });

      expect(caption).toBe("Última parcela (8 de 8). Não gera parcelas futuras.");
    });

    it("retorna erro se current > total", () => {
      const caption = formatInstallmentCaption({
        dueDate: "2026-11-03",
        current: 9,
        total: 8,
        amountCents: 108800,
      });

      expect(caption).toBe("A parcela atual não pode ser maior que o total de parcelas.");
    });
  });

  describe("validateExpenseForm", () => {
    it("rejeita formulário vazio", () => {
      const errors = validateExpenseForm({
        description: "",
        amountCents: null,
        dueDate: "",
        categoryId: "",
        isInstallment: false,
        installmentCurrent: 1,
        installmentTotal: 2,
      });

      expect(errors.description).toBe("Descrição é obrigatória");
      expect(errors.amount).toBe("Informe um valor maior que zero.");
      expect(errors.dueDate).toBe("Data de vencimento é obrigatória");
      expect(errors.categoryId).toBe("Selecione um tipo de despesa");
    });

    it("rejeita valor zero ou negativo com mensagem contratual", () => {
      const errorsZero = validateExpenseForm({
        description: "Mercado",
        amountCents: 0,
        dueDate: "2026-11-03",
        categoryId: "cat-1",
        isInstallment: false,
        installmentCurrent: 1,
        installmentTotal: 2,
      });

      expect(errorsZero.amount).toBe("Informe um valor maior que zero.");
    });

    it("valida campos de parcelamento quando ativo", () => {
      const errors = validateExpenseForm({
        description: "Geladeira",
        amountCents: 20000,
        dueDate: "2026-11-03",
        categoryId: "cat-1",
        isInstallment: true,
        installmentCurrent: 5,
        installmentTotal: 3,
      });

      expect(errors.installmentCurrent).toBe(
        "A parcela atual não pode ser maior que o total de parcelas."
      );
    });

    it("aceita formulário válido", () => {
      const errors = validateExpenseForm({
        description: "Parcela do carro",
        amountCents: 108800,
        dueDate: "2026-11-03",
        categoryId: "cat-3",
        isInstallment: true,
        installmentCurrent: 7,
        installmentTotal: 8,
      });

      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("filterAvailablePaymentMethods", () => {
    const methods = [
      { id: "pm-1", name: "Nubank", archived: false },
      { id: "pm-2", name: "Bradesco", archived: false },
      { id: "pm-3", name: "Inter Antigo", archived: true },
      { id: "pm-4", name: "C6 Arquivado", archived: true },
    ];

    it("retorna apenas métodos ativos quando não há método inicial (nova despesa)", () => {
      const available = filterAvailablePaymentMethods(methods, null);
      expect(available.map((m) => m.id)).toEqual(["pm-1", "pm-2"]);
    });

    it("retorna ativos mais a forma arquivada se ela for a forma da despesa na edição", () => {
      const available = filterAvailablePaymentMethods(methods, "pm-3");
      expect(available.map((m) => m.id)).toEqual(["pm-1", "pm-2", "pm-3"]);
    });

    it("não inclui outras formas arquivadas mesmo na edição", () => {
      const available = filterAvailablePaymentMethods(methods, "pm-3");
      expect(available.some((m) => m.id === "pm-4")).toBe(false);
    });
  });

  describe("suggestCardDueDateAndMonth", () => {
    const cardPm = {
      id: "card-1",
      name: "Nubank",
      type: "cartao",
      closingDay: 5,
      dueDay: 15,
    };

    it("sugere vencimento e mês de referência para despesa nova", () => {
      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: cardPm,
        today: "2026-05-03", // antes do fechamento (5)
        isEdit: false,
        dueDateManuallyEdited: false,
      });

      expect(result).toEqual({
        dueDate: "2026-05-15",
        referenceMonth: "2026-05",
      });
    });

    it("sugere vencimento no mês seguinte se compra após o fechamento", () => {
      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: cardPm,
        today: "2026-05-10", // após o fechamento (5)
        isEdit: false,
        dueDateManuallyEdited: false,
      });

      expect(result).toEqual({
        dueDate: "2026-06-15",
        referenceMonth: "2026-06",
      });
    });

    it("não sobrescreve vencimento se o usuário já editou manualmente", () => {
      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: cardPm,
        today: "2026-05-03",
        isEdit: false,
        dueDateManuallyEdited: true,
      });

      expect(result).toEqual({
        dueDate: undefined,
        referenceMonth: "2026-05",
      });
    });

    it("não sugere se estiver em modo de edição", () => {
      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: cardPm,
        today: "2026-05-03",
        isEdit: true,
        dueDateManuallyEdited: false,
      });

      expect(result).toBeNull();
    });

    it("não sugere se o método não for cartão", () => {
      const contaPm = {
        id: "conta-1",
        name: "Bradesco",
        type: "conta",
        closingDay: 5,
        dueDay: 15,
      };

      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: contaPm,
        today: "2026-05-03",
        isEdit: false,
        dueDateManuallyEdited: false,
      });

      expect(result).toBeNull();
    });

    it("não sugere se o cartão não possuir fechamento ou vencimento", () => {
      const cardNoDays = {
        id: "card-2",
        name: "Cartão sem dias",
        type: "cartao",
        closingDay: null,
        dueDay: null,
      };

      const result = suggestCardDueDateAndMonth({
        selectedPaymentMethod: cardNoDays,
        today: "2026-05-03",
        isEdit: false,
        dueDateManuallyEdited: false,
      });

      expect(result).toBeNull();
    });
  });
});
