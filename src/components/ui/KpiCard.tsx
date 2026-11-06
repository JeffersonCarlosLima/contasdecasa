import { formatBRL } from "@/lib/money";
import { cx } from "./cx";

export type KpiTone = "neutro" | "invest" | "positive" | "negative";

export function KpiCard({
  label,
  cents,
  hint,
  tone = "neutro",
}: {
  label: string;
  cents: number;
  hint?: string;
  tone?: KpiTone;
}) {
  return (
    <div className={cx("cc-card cc-kpi", tone !== "neutro" && `cc-kpi--${tone}`)}>
      <span className="cc-kpi__label">{label}</span>
      <span className="cc-kpi__value cc-num">{formatBRL(cents)}</span>
      {hint && <span className="cc-kpi__delta">{hint}</span>}
    </div>
  );
}
