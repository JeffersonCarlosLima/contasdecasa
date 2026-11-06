import { describe, expect, it } from "vitest";
import {
  allocate,
  computeSplit,
  customPercentsValid,
  futureInstallments,
  monthSummary,
  splitAmount,
  type CalcExpense,
  type CalcMember,
} from "./index";

const J: CalcMember = { id: "J", participatesInSplit: true, salaryCents: 320_000, customPercentBp: 7000 };
const L: CalcMember = { id: "L", participatesInSplit: true, salaryCents: 330_000, customPercentBp: 3000 };
const F: CalcMember = { id: "F", participatesInSplit: false, salaryCents: 0 };

const fam = (amountCents: number, extra: Partial<CalcExpense> = {}): CalcExpense => ({
  amountCents,
  ownerMemberId: null,
  status: "pendente",
  ...extra,
});

describe("allocate", () => {
  it("a soma sempre bate e a sobra vai para a maior parte", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(100_001, [1, 1])).toEqual([50_001, 50_000]);
    expect(allocate(100_001, [3, 7])).toEqual([30_000, 70_001]);
  });
});

describe("mês", () => {
  it("renda − investimento = disponível; disponível − gasto = sobra", () => {
    const r = monthSummary({
      incomes: [
        { salaryCents: 320_000, extraCents: 250_000 },
        { salaryCents: 330_000, extraCents: 0 },
      ],
      investMode: "valor",
      investValue: 150_000,
      expenseAmounts: [500_00, 2_497_17],
    });
    expect(r.incomeCents).toBe(900_000);
    expect(r.availableCents).toBe(750_000);
    expect(r.spentCents).toBe(299_717);
    expect(r.leftoverCents).toBe(450_283);
  });

  it("investimento percentual (pontos-base) sobre a renda", () => {
    const r = monthSummary({
      incomes: [{ salaryCents: 900_000, extraCents: 0 }],
      investMode: "percentual",
      investValue: 1000, // 10%
      expenseAmounts: [],
    });
    expect(r.investmentCents).toBe(90_000);
  });

  it("mês sem renda: tudo zero, sobra negativa pelo gasto", () => {
    const r = monthSummary({ incomes: [], investMode: "percentual", investValue: 1500, expenseAmounts: [10_000] });
    expect(r).toMatchObject({ incomeCents: 0, investmentCents: 0, availableCents: 0, leftoverCents: -10_000 });
  });

  it("sobra negativa", () => {
    const r = monthSummary({
      incomes: [{ salaryCents: 100_000, extraCents: 0 }],
      investMode: "valor",
      investValue: 20_000,
      expenseAmounts: [90_000],
    });
    expect(r.leftoverCents).toBe(-10_000);
  });
});

describe("divisão das despesas da família", () => {
  it("2 membros, partes iguais (centavo extra para o primeiro)", () => {
    expect(splitAmount(100_001, "igual", [J, L])).toEqual([50_001, 50_000]);
  });

  it("proporcional ao salário (sem extras)", () => {
    expect(splitAmount(120_000, "proporcional", [J, L])).toEqual([59_076, 60_924]);
  });

  it("personalizada pelos percentuais", () => {
    expect(splitAmount(100_001, "personalizada", [J, L])).toEqual([70_001, 30_000]);
    expect(customPercentsValid([J, L])).toBe(true);
    expect(customPercentsValid([J, { ...L, customPercentBp: 2000 }])).toBe(false);
  });

  it("dependente fora da divisão não recebe parte, mas responde pelas próprias despesas", () => {
    const expenses: CalcExpense[] = [
      fam(100_000),
      { amountCents: 5_000, ownerMemberId: "F", status: "pendente" },
    ];
    const r = computeSplit({ rule: "igual", members: [J, L, F], expenses });
    const byId = Object.fromEntries(r.members.map((m) => [m.memberId, m]));
    expect(byId.F).toMatchObject({ ownCents: 5_000, familyShareCents: 0, responsibilityCents: 5_000 });
    expect(byId.J!.familyShareCents + byId.L!.familyShareCents).toBe(100_000);
  });

  it("proporcional sem salários cai em partes iguais", () => {
    const zero = [{ ...J, salaryCents: 0 }, { ...L, salaryCents: 0 }];
    expect(splitAmount(1_000, "proporcional", zero)).toEqual([500, 500]);
  });

  it("sem participantes: despesas da família ficam não atribuídas", () => {
    const r = computeSplit({ rule: "igual", members: [{ ...J, participatesInSplit: false }], expenses: [fam(1_000)] });
    expect(r.unassignedFamilyCents).toBe(1_000);
  });

  it("responsabilidade soma exatamente o gasto e o acerto zera os saldos", () => {
    const expenses: CalcExpense[] = [
      { amountCents: 75_000, ownerMemberId: null, status: "pago", paidByMemberId: "J" },
      { amountCents: 15_000, ownerMemberId: null, status: "pago", paidByMemberId: "L" },
      { amountCents: 30_000, ownerMemberId: null, status: "pendente" },
      { amountCents: 384_717, ownerMemberId: "J", status: "pendente" },
      { amountCents: 108_800, ownerMemberId: "L", status: "pendente" },
    ];
    const r = computeSplit({ rule: "proporcional", members: [J, L, F], expenses });
    const total = expenses.reduce((a, e) => a + e.amountCents, 0);
    expect(r.members.reduce((a, m) => a + m.responsibilityCents, 0)).toBe(total);
    expect(r.members.reduce((a, m) => a + m.balanceCents, 0)).toBe(0);
    expect(r.settlements).toEqual([{ fromMemberId: "L", toMemberId: "J", cents: 30_693 }]);
  });
});

describe("parcelas", () => {
  it("atravessam o ano e ajustam o dia ao fim do mês", () => {
    const r = futureInstallments({ dueDate: "2026-11-30", current: 11, total: 14 });
    expect(r.map((p) => [p.number, p.dueDate, p.referenceMonth])).toEqual([
      [12, "2026-12-30", "2026-12-01"],
      [13, "2027-01-30", "2027-01-01"],
      [14, "2027-02-28", "2027-02-01"],
    ]);
  });

  it("última parcela não gera nada", () => {
    expect(futureInstallments({ dueDate: "2026-11-03", current: 8, total: 8 })).toEqual([]);
  });
});
