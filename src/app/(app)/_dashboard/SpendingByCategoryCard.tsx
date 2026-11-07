import { formatBRL } from "@/lib/money";
import { cx } from "@/components/ui/cx";
import { processCategories } from "./helpers";
import type { DashboardByCategoryItem } from "./types";

interface SpendingByCategoryCardProps {
  byCategory: DashboardByCategoryItem[];
  totalSpentCents: number;
}

export function SpendingByCategoryCard({ byCategory, totalSpentCents }: SpendingByCategoryCardProps) {
  const processed = processCategories(byCategory);

  return (
    <section className="cc-card">
      <div className="cc-card__head">
        <h2 className="title">Gastos por categoria</h2>
        <span className="caption cc-muted">{formatBRL(totalSpentCents)} no total</span>
      </div>

      {processed.map((item) => {
        const pct = totalSpentCents > 0 ? (item.totalCents / totalSpentCents) * 100 : 0;
        const isZero = item.totalCents === 0;

        return (
          <div key={item.category.id} className="cc-cat">
            <span className="cc-cat__name">
              <span
                className="cc-chip__dot"
                style={{ background: `var(--${item.category.color})` }}
              />
              {item.category.name}
            </span>
            <div className="cc-cat__track">
              <div
                className="cc-cat__fill"
                style={{
                  width: `${pct}%`,
                  background: `var(--${item.category.color})`,
                }}
              />
            </div>
            <span className={cx("cc-cat__val", isZero && "cc-muted")}>
              {formatBRL(item.totalCents)}
            </span>
          </div>
        );
      })}
    </section>
  );
}
