import { SpendingByPersonCard } from "./SpendingByPersonCard";
import { SpendingByCategoryCard } from "./SpendingByCategoryCard";
import { SplitWhoPaysCard } from "./SplitWhoPaysCard";
import type { DashboardByPersonItem, DashboardByCategoryItem, DashboardSplit } from "./types";

interface DashboardGrid2Props {
  byPerson: DashboardByPersonItem[];
  byCategory: DashboardByCategoryItem[];
  split: DashboardSplit;
  totalSpentCents: number;
}

export function DashboardGrid2({
  byPerson,
  byCategory,
  split,
  totalSpentCents,
}: DashboardGrid2Props) {
  return (
    <div className="cc-grid2">
      <SpendingByPersonCard byPerson={byPerson} totalSpentCents={totalSpentCents} />
      <SpendingByCategoryCard byCategory={byCategory} totalSpentCents={totalSpentCents} />
      <SplitWhoPaysCard split={split} />
    </div>
  );
}
