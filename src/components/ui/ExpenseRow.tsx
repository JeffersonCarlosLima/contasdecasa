import type { ReactNode } from "react";
import { formatBRL } from "@/lib/money";
import { StatusBadge, type BadgeStatus } from "./StatusBadge";

/** Ordem do metadado: avatar e dono · vencimento · parcela · observação. */
export function ExpenseRow({
  title,
  categoryColor,
  meta,
  cents,
  status,
  action,
}: {
  title: string;
  categoryColor: string;
  meta: ReactNode;
  cents: number;
  status: BadgeStatus;
  action?: ReactNode;
}) {
  return (
    <div className="cc-expense">
      <div className="cc-expense__icon"><span style={{ background: `var(--${categoryColor})` }} /></div>
      <div className="cc-expense__main">
        <span className="cc-expense__title">{title}</span>
        <span className="cc-expense__meta">{meta}</span>
      </div>
      <div className="cc-expense__side">
        <span className="cc-expense__value cc-num">{formatBRL(cents)}</span>
        <StatusBadge status={status} />
      </div>
      {action && <div className="cc-expense__action">{action}</div>}
    </div>
  );
}
