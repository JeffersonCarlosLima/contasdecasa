import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import { getMonthClose } from "./period-queries";

describe("period-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devolve valores padrão sem criar nada quando não há período no banco", async () => {
    // 1. families (defaultSplitRule = 'igual')
    // 2. monthlyPeriods (empty)
    // 3. familyMembers (1 membro)
    // 4. expenses (empty)
    // 5. recurringExpenses (1 ativa)
    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ defaultSplitRule: "igual" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                id: "mem_1",
                displayName: "Jefferson",
                color: "person-a",
                kinship: "titular",
                userId: "usr_1",
                participatesInSplit: true,
                customPercent: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ description: "Aluguel" }]),
        }),
      } as unknown as ReturnType<typeof db.select>);

    const data = await getMonthClose("fam_123", "2026-11");

    expect(data.month).toBe("2026-11");
    expect(data.closed).toBe(false);
    expect(data.investMode).toBe("valor");
    expect(data.investValue).toBe(0);
    expect(data.splitRule).toBe("igual");
    expect(data.members).toHaveLength(1);
    expect(data.members[0]).toMatchObject({
      displayName: "Jefferson",
      hasLogin: true,
      salaryCents: 0,
      extraCents: 0,
    });
    expect(data.recurring.copied).toBe(false);
    expect(data.recurring.names).toEqual(["Aluguel"]);
    expect(data.previousMonthLabel).toBe("Outubro 2026");
  });

  it("retorna período salvo, rendas e calcula resumo e divisão", async () => {
    // 1. families
    // 2. monthlyPeriods (period_1, investMode = 'valor', investValue = 50000, closedAt != null)
    // 3. familyMembers
    // 4. memberIncomes (salary = 300000, extra = 50000)
    // 5. expenses (1 despesa de 100000, com recurringId)
    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ defaultSplitRule: "proporcional" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "period_1",
                investMode: "valor",
                investValue: 50000,
                investDestination: "Reserva",
                splitRule: "proporcional",
                closedAt: new Date(),
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                id: "mem_1",
                displayName: "Jefferson",
                color: "person-a",
                kinship: "titular",
                userId: "usr_1",
                participatesInSplit: true,
                customPercent: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              memberId: "mem_1",
              salaryCents: 300000,
              extraCents: 50000,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              amountCents: 100000,
              ownerMemberId: null,
              paidByMemberId: "mem_1",
              status: "pago",
              recurringId: "rec_1",
              description: "Internet",
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.select>);

    const data = await getMonthClose("fam_123", "2026-11");

    expect(data.closed).toBe(true);
    expect(data.investDestination).toBe("Reserva");
    expect(data.splitRule).toBe("proporcional");
    expect(data.summary.incomeCents).toBe(350000); // 3000 + 500
    expect(data.summary.investmentCents).toBe(50000);
    expect(data.summary.availableCents).toBe(300000);
    expect(data.summary.spentCents).toBe(100000);
    expect(data.summary.leftoverCents).toBe(200000);
    expect(data.recurring.copied).toBe(true);
    expect(data.recurring.names).toEqual(["Internet"]);
  });
});
