import Link from "next/link";
import { addMonths } from "@/lib/calc";
import { monthLabel } from "@/lib/dates";

const chevron = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** `month` = "YYYY-MM". Navega pela URL (?mes=). */
export function MonthSwitcher({ month, basePath, closed }: { month: string; basePath: string; closed?: boolean }) {
  const prev = addMonths(`${month}-01`, -1).slice(0, 7);
  const next = addMonths(`${month}-01`, 1).slice(0, 7);
  return (
    <div className="cc-month">
      <Link className="cc-month__btn" href={`${basePath}?mes=${prev}`} aria-label="Mês anterior">{chevron("m15 18-6-6 6-6")}</Link>
      <span className="cc-month__label">{monthLabel(month)}</span>
      <Link className="cc-month__btn" href={`${basePath}?mes=${next}`} aria-label="Próximo mês">{chevron("m9 18 6-6-6-6")}</Link>
      {closed && <span className="cc-month__closed">Fechado</span>}
    </div>
  );
}
