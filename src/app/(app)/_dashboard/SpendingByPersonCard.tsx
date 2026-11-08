import { formatBRL } from "@/lib/money";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { cx } from "@/components/ui/cx";
import type { DashboardByPersonItem } from "./types";

interface SpendingByPersonCardProps {
  byPerson: DashboardByPersonItem[];
  totalSpentCents: number;
}

export function SpendingByPersonCard({ byPerson, totalSpentCents }: SpendingByPersonCardProps) {
  return (
    <section className="cc-card">
      <div className="cc-card__head">
        <h2 className="title">Gastos por pessoa</h2>
        <span className="caption cc-muted">Quem é dono da despesa</span>
      </div>

      {byPerson.map((item, idx) => {
        const isFamily = item.owner === null;
        const name = isFamily ? "Família" : item.owner!.displayName;
        const color = isFamily ? "family" : (item.owner!.color as PersonColor || "person-a");
        const key = isFamily ? "family" : item.owner!.id || `person-${idx}`;
        const pct = totalSpentCents > 0 ? (item.totalCents / totalSpentCents) * 100 : 0;
        const isZero = item.totalCents === 0;

        return (
          <div key={key} className="cc-cat">
            <span className="cc-cat__name">
              <MemberAvatar name={name} color={color} />
              {name}
            </span>
            <div className="cc-cat__track">
              <div
                className="cc-cat__fill"
                style={{
                  width: `${pct}%`,
                  background: `var(--${color})`,
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
