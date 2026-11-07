import { describe, expect, it } from "vitest";
import {
  buildSeedExpenses,
  SEED_CATEGORIES,
  SEED_MEMBERS,
  SEED_PAYMENT_METHODS,
  SEED_USERS,
} from "./seed";

describe("Seed pure data definitions and builder", () => {
  it("contém os 2 usuários com credenciais de desenvolvimento", () => {
    expect(SEED_USERS).toHaveLength(2);
    expect(SEED_USERS.map((u) => u.email)).toEqual([
      "jefferson@exemplo.com",
      "lorrane@exemplo.com",
    ]);
    expect(SEED_USERS.every((u) => u.password === "senha-dev-contas")).toBe(true);
  });

  it("define 3 membros da família (Jefferson, Lorrane e Filho(a))", () => {
    expect(SEED_MEMBERS).toHaveLength(3);
    const jeff = SEED_MEMBERS.find((m) => m.displayName === "Jefferson")!;
    const lor = SEED_MEMBERS.find((m) => m.displayName === "Lorrane")!;
    const filho = SEED_MEMBERS.find((m) => m.displayName === "Filho(a)")!;

    expect(jeff.role).toBe("dono");
    expect(jeff.participatesInSplit).toBe(true);
    expect(jeff.salaryCents).toBe(500000);
    expect(jeff.extraCents).toBe(50000);

    expect(lor.role).toBe("admin");
    expect(lor.participatesInSplit).toBe(true);
    expect(lor.salaryCents).toBe(350000);

    expect(filho.participatesInSplit).toBe(false);
    expect(filho.userEmail).toBeUndefined();
  });

  it("define 6 categorias padrão de chart-1 a chart-6", () => {
    expect(SEED_CATEGORIES).toHaveLength(6);
    expect(SEED_CATEGORIES.map((c) => c.name)).toEqual([
      "Moradia",
      "Alimentação",
      "Transporte",
      "Cartões",
      "Contas da casa",
      "Saúde e academia",
    ]);
  });

  it("define formas de pagamento incluindo cartões e pix", () => {
    expect(SEED_PAYMENT_METHODS.length).toBeGreaterThanOrEqual(4);
    expect(SEED_PAYMENT_METHODS.some((p) => p.name === "Cartão Bradesco")).toBe(true);
    expect(SEED_PAYMENT_METHODS.some((p) => p.name === "Pix")).toBe(true);
  });

  describe("buildSeedExpenses", () => {
    const month = "2026-11";
    const expenses = buildSeedExpenses(month);

    it("gera 9 despesas no mês corrente e 1 parcela futura (8 de 8)", () => {
      // 9 despesas normais + 1 parcela futura do carro (8 de 8)
      expect(expenses).toHaveLength(10);

      const currentMonthExpenses = expenses.filter(
        (e) => e.referenceMonth === `${month}-01`,
      );
      expect(currentMonthExpenses).toHaveLength(9);

      const futureMonthExpenses = expenses.filter(
        (e) => e.referenceMonth === "2026-12-01",
      );
      expect(futureMonthExpenses).toHaveLength(1);
      expect(futureMonthExpenses[0]!.description).toBe("Parcela do carro");
      expect(futureMonthExpenses[0]!.installmentNumber).toBe(8);
      expect(futureMonthExpenses[0]!.installmentTotal).toBe(8);
      expect(futureMonthExpenses[0]!.dueDate).toBe("2026-12-03");
    });

    it("soma exatamente R$ 6.135,17 no total do mês, batendo com o protótipo", () => {
      const currentMonthExpenses = expenses.filter(
        (e) => e.referenceMonth === `${month}-01`,
      );
      const total = currentMonthExpenses.reduce((acc, cur) => acc + cur.amountCents, 0);
      expect(total).toBe(613517); // R$ 6.135,17
    });

    it("total pago é R$ 900,00 e pendente é R$ 5.235,17", () => {
      const currentMonthExpenses = expenses.filter(
        (e) => e.referenceMonth === `${month}-01`,
      );
      const paid = currentMonthExpenses
        .filter((e) => e.status === "pago")
        .reduce((acc, cur) => acc + cur.amountCents, 0);
      const pending = currentMonthExpenses
        .filter((e) => e.status === "pendente")
        .reduce((acc, cur) => acc + cur.amountCents, 0);

      expect(paid).toBe(90000); // R$ 900,00 (Aluguel 750 + Internet 150)
      expect(pending).toBe(523517); // R$ 5.235,17
    });

    it("distribuição por pessoa bate exatamente com o protótipo", () => {
      const currentMonthExpenses = expenses.filter(
        (e) => e.referenceMonth === `${month}-01`,
      );

      const jeffersonTotal = currentMonthExpenses
        .filter((e) => e.ownerName === "Jefferson")
        .reduce((acc, cur) => acc + cur.amountCents, 0);
      expect(jeffersonTotal).toBe(384717); // R$ 3.847,17

      const lorraneTotal = currentMonthExpenses
        .filter((e) => e.ownerName === "Lorrane")
        .reduce((acc, cur) => acc + cur.amountCents, 0);
      expect(lorraneTotal).toBe(108800); // R$ 1.088,00

      const familiaTotal = currentMonthExpenses
        .filter((e) => e.ownerName === null)
        .reduce((acc, cur) => acc + cur.amountCents, 0);
      expect(familiaTotal).toBe(120000); // R$ 1.200,00
    });
  });
});
