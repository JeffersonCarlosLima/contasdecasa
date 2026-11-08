import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/period-queries", () => ({
  getMonthClose: vi.fn(),
}));

vi.mock("@/lib/expense-queries", () => ({
  listExpenses: vi.fn(),
}));

import { db } from "@/db";
import { getMonthClose } from "@/lib/period-queries";
import { listExpenses } from "@/lib/expense-queries";
import {
  formatSettlementText,
  formatSplitRuleText,
  getDashboard,
} from "./dashboard-queries";

describe("dashboard-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatSplitRuleText", () => {
    it("formata texto com 2 participantes e regra proporcional", () => {
      const text = formatSplitRuleText("proporcional", 120000, [
        { displayName: "Jefferson" },
        { displayName: "Lorrane" },
      ]);
      expect(text).toBe(
        "Despesas próprias + parte das despesas da família (R$ 1.200,00), dividida proporcional ao salário entre Jefferson e Lorrane.",
      );
    });

    it("formata texto com regra igual e 3 participantes", () => {
      const text = formatSplitRuleText("igual", 90000, [
        { displayName: "Jefferson" },
        { displayName: "Lorrane" },
        { displayName: "Filho" },
      ]);
      expect(text).toBe(
        "Despesas próprias + parte das despesas da família (R$ 900,00), dividida em partes iguais entre Jefferson, Lorrane e Filho.",
      );
    });

    it("formata texto com regra personalizada", () => {
      const text = formatSplitRuleText("personalizada", 50000, [
        { displayName: "Jefferson" },
      ]);
      expect(text).toBe(
        "Despesas próprias + parte das despesas da família (R$ 500,00), dividida por percentuais combinados entre Jefferson.",
      );
    });

    it("lida com lista vazia de participantes", () => {
      const text = formatSplitRuleText("igual", 0, []);
      expect(text).toBe("Despesas próprias + parte das despesas da família (R$ 0,00).");
    });
  });

  describe("formatSettlementText", () => {
    it("retorna null se não houver acertos", () => {
      expect(formatSettlementText([], [])).toBeNull();
    });

    it("formata acerto único corretamente", () => {
      const text = formatSettlementText(
        [{ fromMemberId: "m2", toMemberId: "m1", cents: 30692 }],
        [
          { id: "m1", displayName: "Jefferson" },
          { id: "m2", displayName: "Lorrane" },
        ],
      );
      expect(text).toBe("Lorrane deve R$ 306,92 a Jefferson");
    });

    it("formata múltiplos acertos separados por ponto e vírgula", () => {
      const text = formatSettlementText(
        [
          { fromMemberId: "m2", toMemberId: "m1", cents: 10000 },
          { fromMemberId: "m3", toMemberId: "m1", cents: 5000 },
        ],
        [
          { id: "m1", displayName: "Jefferson" },
          { id: "m2", displayName: "Lorrane" },
          { id: "m3", displayName: "Filho" },
        ],
      );
      expect(text).toBe("Lorrane deve R$ 100,00 a Jefferson; Filho deve R$ 50,00 a Jefferson");
    });
  });

  describe("getDashboard", () => {
    const mockMonthClose = {
      month: "2026-11",
      closed: false,
      investMode: "valor" as const,
      investValue: 150000,
      investDestination: "Tesouro",
      splitRule: "proporcional" as const,
      members: [
        {
          id: "m1",
          displayName: "Jefferson",
          color: "person-a" as const,
          kinship: "titular",
          hasLogin: true,
          participatesInSplit: true,
          customPercent: null,
          salaryCents: 500000,
          extraCents: 50000,
        },
        {
          id: "m2",
          displayName: "Lorrane",
          color: "person-b" as const,
          kinship: "cônjuge",
          hasLogin: true,
          participatesInSplit: true,
          customPercent: null,
          salaryCents: 350000,
          extraCents: 0,
        },
      ],
      summary: {
        incomeCents: 900000,
        investmentCents: 150000,
        availableCents: 750000,
        spentCents: 613517,
        leftoverCents: 136483,
      },
      split: {
        members: [
          {
            memberId: "m1",
            ownCents: 384717,
            familyShareCents: 59077,
            responsibilityCents: 443794,
            paidCents: 75000,
            paidResponsibilityCents: 443794,
            balanceCents: -368794,
          },
          {
            memberId: "m2",
            ownCents: 108800,
            familyShareCents: 60923,
            responsibilityCents: 169723,
            paidCents: 15000,
            paidResponsibilityCents: 169723,
            balanceCents: -154723,
          },
        ],
        unassignedFamilyCents: 0,
        settlements: [{ fromMemberId: "m2", toMemberId: "m1", cents: 30692 }],
      },
      recurring: { copied: true, names: ["Aluguel"] },
      previousMonthLabel: "Outubro 2026",
    };

    const mockExpenses = {
      items: [
        {
          id: "e1",
          description: "Parcela do carro",
          amountCents: 108800,
          category: { id: "cat_transport", name: "Transporte", color: "chart-3" },
          owner: { id: "m2", displayName: "Lorrane", color: "person-b", removed: false },
          paymentMethod: null,
          dueDate: "2026-11-03",
          status: "atrasado" as const,
          paidAt: null,
          paidBy: null,
          installment: { current: 7, total: 8 },
          recurring: false,
          notes: null,
          referenceMonth: "2026-11",
        },
        {
          id: "e2",
          description: "Fatura Bradesco",
          amountCents: 249717,
          category: { id: "cat_cartoes", name: "Cartões", color: "chart-4" },
          owner: { id: "m1", displayName: "Jefferson", color: "person-a", removed: false },
          paymentMethod: null,
          dueDate: "2026-11-12",
          status: "pendente" as const,
          paidAt: null,
          paidBy: null,
          installment: null,
          recurring: false,
          notes: "inclui seguro",
          referenceMonth: "2026-11",
        },
        {
          id: "e3",
          description: "Internet",
          amountCents: 120000,
          category: { id: "cat_contas", name: "Contas", color: "chart-5" },
          owner: null,
          paymentMethod: null,
          dueDate: "2026-11-20",
          status: "pago" as const,
          paidAt: new Date("2026-11-10"),
          paidBy: { id: "m1", displayName: "Jefferson" },
          installment: null,
          recurring: true,
          notes: null,
          referenceMonth: "2026-11",
        },
      ],
      totals: {
        count: 3,
        totalCents: 478517,
        pendingCents: 358517,
      },
      groups: [
        {
          owner: { id: "m1", displayName: "Jefferson", color: "person-a", removed: false },
          items: [],
          subtotalCents: 249717,
          paidCents: 0,
          pendingCents: 249717,
        },
        {
          owner: { id: "m2", displayName: "Lorrane", color: "person-b", removed: false },
          items: [],
          subtotalCents: 108800,
          paidCents: 0,
          pendingCents: 108800,
        },
        {
          owner: null,
          items: [],
          subtotalCents: 120000,
          paidCents: 120000,
          pendingCents: 0,
        },
      ],
    };

    it("retorna dados consolidados para a família toda", async () => {
      vi.mocked(getMonthClose).mockResolvedValue(mockMonthClose);
      vi.mocked(listExpenses).mockResolvedValue(mockExpenses);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "cat_transport", name: "Transporte", color: "chart-3", monthlyLimitCents: 200000 },
            { id: "cat_cartoes", name: "Cartões", color: "chart-4", monthlyLimitCents: 300000 },
            { id: "cat_contas", name: "Contas", color: "chart-5", monthlyLimitCents: null },
          ]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const data = await getDashboard("fam_1", "2026-11");

      expect(data.monthLabel).toBe("Novembro 2026");
      expect(data.members).toHaveLength(2);
      expect(data.members[0]!.displayName).toBe("Jefferson");
      expect(data.kpis.incomeCents).toBe(900000);
      expect(data.kpis.investmentCents).toBe(150000);
      expect(data.kpis.availableCents).toBe(750000);
      expect(data.kpis.spentCents).toBe(478517);
      expect(data.budget.paidCents).toBe(120000);
      expect(data.budget.pendingCents).toBe(358517);
      expect(data.byPerson).toHaveLength(3);
      expect(data.byCategory).toHaveLength(3);
      expect(data.byCategory[0]!.category.monthlyLimitCents).toBe(300000); // Cartões é o maior
      expect(data.split.ruleText).toContain("dividida proporcional ao salário entre Jefferson e Lorrane");
      expect(data.split.settlementText).toBe("Lorrane deve R$ 306,92 a Jefferson");
      expect(data.empty).toBe(false);
      expect(data.hasIncome).toBe(true);
      expect(data.closed).toBe(false);

      // Próximos vencimentos: e1 (atrasado) deve vir antes de e2 (pendente)
      expect(data.upcoming).toHaveLength(2);
      expect(data.upcoming[0]!.id).toBe("e1");
      expect(data.upcoming[1]!.id).toBe("e2");
    });

    it("filtra dados por membro quando memberId é informado", async () => {
      vi.mocked(getMonthClose).mockResolvedValue(mockMonthClose);

      const filteredMock = {
        ...mockExpenses,
        items: [mockExpenses.items[1]!], // Apenas fatura Bradesco do Jefferson
        totals: { count: 1, totalCents: 249717, pendingCents: 249717 },
      };
      vi.mocked(listExpenses).mockResolvedValue(filteredMock);

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const data = await getDashboard("fam_1", "2026-11", "m1");

      // Jefferson: 5000 + 500 extra = 550000
      expect(data.kpis.incomeCents).toBe(550000);
      // Investimento proporcional à renda: round(150000 * 550000 / 900000) = 91667
      expect(data.kpis.investmentCents).toBe(91667);
      expect(data.kpis.spentCents).toBe(249717);
      expect(data.byPerson).toHaveLength(1);
      expect(data.byPerson[0]!.owner?.displayName).toBe("Jefferson");
      expect(data.upcoming).toHaveLength(1);
      expect(data.upcoming[0]!.id).toBe("e2");
    });

    it("retorna empty: true e listas vazias quando não há despesas", async () => {
      vi.mocked(getMonthClose).mockResolvedValue({
        ...mockMonthClose,
        summary: {
          incomeCents: 0,
          investmentCents: 0,
          availableCents: 0,
          spentCents: 0,
          leftoverCents: 0,
        },
      });

      vi.mocked(listExpenses).mockResolvedValue({
        items: [],
        totals: { count: 0, totalCents: 0, pendingCents: 0 },
        groups: [],
      });

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const data = await getDashboard("fam_1", "2026-11");

      expect(data.empty).toBe(true);
      expect(data.hasIncome).toBe(false);
      expect(data.byCategory).toHaveLength(0);
      expect(data.upcoming).toHaveLength(0);
    });
  });
});
