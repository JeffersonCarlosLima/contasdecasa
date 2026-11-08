import { BudgetBar } from "@/components/ui/BudgetBar";
import { getMonthNameLower } from "./helpers";
import type { DashboardBudget as DashboardBudgetType } from "./types";

interface DashboardBudgetProps {
  monthLabel: string;
  incomeCents: number;
  budget: DashboardBudgetType;
}

export function DashboardBudget({ monthLabel, incomeCents, budget }: DashboardBudgetProps) {
  const monthName = getMonthNameLower(monthLabel);
  const title = `Para onde vai a renda de ${monthName}`;

  return (
    <BudgetBar
      title={title}
      incomeCents={incomeCents}
      investedCents={budget.investedCents}
      paidCents={budget.paidCents}
      pendingCents={budget.pendingCents}
    />
  );
}
