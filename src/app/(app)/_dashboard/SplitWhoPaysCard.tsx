import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { cx } from "@/components/ui/cx";
import type { DashboardSplit } from "./types";

interface SplitWhoPaysCardProps {
  split: DashboardSplit;
}

export function SplitWhoPaysCard({ split }: SplitWhoPaysCardProps) {
  const participants = split.members.filter((m) => m.inSplit);
  const totalResponsibility = participants.reduce((acc, cur) => acc + cur.totalCents, 0);

  const ariaLabel = participants
    .map((p) => {
      const pct = totalResponsibility > 0 ? Math.round((p.totalCents / totalResponsibility) * 100) : 0;
      return `${p.name} ${pct}%`;
    })
    .join(", ");

  return (
    <section className="cc-card">
      <div className="cc-card__head" style={{ marginBottom: 4 }}>
        <h2 className="title">Quanto cada um paga</h2>
        <Link className="cc-btn cc-btn--ghost cc-btn--sm" href="/mes" style={{ textDecoration: "none" }}>
          Regras
        </Link>
      </div>

      <div className="caption cc-muted" style={{ marginBottom: 16 }}>
        {split.ruleText}
      </div>

      <div
        className="cc-split__bar"
        style={{ margin: "0 0 16px" }}
        role="img"
        aria-label={ariaLabel}
      >
        {participants.map((p) => {
          const pct = totalResponsibility > 0 ? (p.totalCents / totalResponsibility) * 100 : 0;
          return (
            <span
              key={p.id}
              style={{
                width: `${pct}%`,
                background: `var(--${p.color})`,
              }}
            />
          );
        })}
      </div>

      {split.members.map((p) => {
        const isZero = p.totalCents === 0;

        return (
          <div key={p.id} className="cc-person-row">
            <span className="cc-split__name">
              <MemberAvatar name={p.name} color={p.color} />
              {p.name}
            </span>
            <span className="caption cc-muted">
              {p.inSplit
                ? `${formatBRL(p.ownCents)} próprias + ${formatBRL(p.familyShareCents)} da família · pagou ${formatBRL(p.paidCents)}`
                : `Dependente · fora da divisão${isZero ? " · sem despesas este mês" : ""}`}
            </span>
            <span className={cx("cc-cat__val cc-num", !p.inSplit && isZero && "cc-muted")}>
              {formatBRL(p.totalCents)}
            </span>
          </div>
        );
      })}

      {split.settlementText && (
        <p className="caption cc-muted" style={{ marginTop: 12 }}>
          {split.settlementText}
        </p>
      )}
    </section>
  );
}
