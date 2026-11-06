import { cx } from "./cx";

export type BadgeStatus = "paid" | "pending" | "late";

const LABEL: Record<BadgeStatus, string> = { paid: "Pago", pending: "Pendente", late: "Atrasado" };
const ICON: Record<BadgeStatus, string> = {
  paid: "M20 6 9 17l-5-5",
  pending: "M12 7v5l3 2",
  late: "M12 8v5M12 16.5v.01",
};

/** Sempre ícone + palavra. "Atrasado" é calculado, nunca escolhido. */
export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span className={cx("cc-badge", `cc-badge--${status}`)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {status !== "paid" && <circle cx="12" cy="12" r="9" />}
        <path d={ICON[status]} />
      </svg>
      {LABEL[status]}
    </span>
  );
}
