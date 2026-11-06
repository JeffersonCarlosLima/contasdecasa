import { formatBRL } from "@/lib/money";
import { MemberAvatar, type PersonColor } from "./MemberAvatar";

export interface SplitPerson {
  id: string;
  name: string;
  color: PersonColor;
  /** Total que cabe a ele (responsabilidade). */
  totalCents: number;
  ownCents: number;
  familyShareCents: number;
  paidCents: number;
  inSplit: boolean;
}

/** Sempre diga a regra em texto e mostre o que cada um já pagou. */
export function SplitCard({
  ruleText,
  people,
  settlementText,
}: {
  ruleText: string;
  people: SplitPerson[];
  settlementText?: string;
}) {
  const bar = people.filter((p) => p.inSplit);
  const total = bar.reduce((a, p) => a + p.totalCents, 0);
  return (
    <section className="cc-card">
      <div className="cc-card__head" style={{ marginBottom: 4 }}><h2 className="title">Quanto cada um paga</h2></div>
      <div className="caption cc-muted" style={{ marginBottom: 16 }}>{ruleText}</div>
      <div className="cc-split__bar" style={{ margin: "0 0 16px" }} role="img" aria-label={bar.map((p) => `${p.name} ${total ? Math.round((p.totalCents / total) * 100) : 0}%`).join(", ")}>
        {bar.map((p) => (
          <span key={p.id} style={{ width: `${total ? (p.totalCents / total) * 100 : 0}%`, background: `var(--${p.color})` }} />
        ))}
      </div>
      {people.map((p) => (
        <div key={p.id} className="cc-person-row">
          <span className="cc-split__name"><MemberAvatar name={p.name} color={p.color} />{p.name}</span>
          <span className="caption cc-muted">
            {p.inSplit
              ? `${formatBRL(p.ownCents)} próprias + ${formatBRL(p.familyShareCents)} da família · pagou ${formatBRL(p.paidCents)}`
              : "Dependente · fora da divisão"}
          </span>
          <span className="cc-cat__val cc-num">{formatBRL(p.totalCents)}</span>
        </div>
      ))}
      {settlementText && <p className="caption cc-muted" style={{ marginTop: 12 }}>{settlementText}</p>}
    </section>
  );
}
