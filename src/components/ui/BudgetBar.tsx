import { formatBRL } from "@/lib/money";

/** Para onde vai a renda: investido, pago, pendente; o livre é o trilho. */
export function BudgetBar({
  title,
  incomeCents,
  investedCents,
  paidCents,
  pendingCents,
}: {
  title: string;
  incomeCents: number;
  investedCents: number;
  paidCents: number;
  pendingCents: number;
}) {
  const free = incomeCents - investedCents - paidCents - pendingCents;
  const pct = (v: number) => (incomeCents > 0 ? Math.min(100, (v / incomeCents) * 100) : 0);
  const label = `Investido ${pct(investedCents).toFixed(1)}%, pago ${pct(paidCents).toFixed(1)}%, pendente ${pct(pendingCents).toFixed(1)}%`;
  return (
    <section className="cc-card cc-budget" aria-label="Para onde vai a renda">
      <h2 className="title">{title}</h2>
      <div className="cc-budget__track" role="img" aria-label={label}>
        <span className="cc-budget__seg--invest" style={{ width: `${pct(investedCents)}%` }} />
        <span className="cc-budget__seg--paid" style={{ width: `${pct(paidCents)}%` }} />
        <span className="cc-budget__seg--pending" style={{ width: `${pct(pendingCents)}%` }} />
      </div>
      <div className="cc-budget__legend">
        <span><i className="cc-budget__key" style={{ background: "var(--invest)" }} />Investido <b>{formatBRL(investedCents)}</b></span>
        <span><i className="cc-budget__key" style={{ background: "var(--paid)" }} />Pago <b>{formatBRL(paidCents)}</b></span>
        <span><i className="cc-budget__key" style={{ background: "var(--pending)" }} />Pendente <b>{formatBRL(pendingCents)}</b></span>
        <span>
          <i className="cc-budget__key" style={{ background: "var(--surface-sunken)", boxShadow: "inset 0 0 0 1px var(--line-strong)" }} />
          Livre <b style={free < 0 ? { color: "var(--danger)" } : undefined}>{formatBRL(free)}</b>
        </span>
      </div>
    </section>
  );
}
