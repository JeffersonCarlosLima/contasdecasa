export interface Installment {
  number: number;
  total: number;
  /** YYYY-MM-DD */
  dueDate: string;
  /** YYYY-MM-01 */
  referenceMonth: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (year: number, month1: number) => new Date(Date.UTC(year, month1, 0)).getUTCDate();

/** Soma meses a um mês "YYYY-MM-01", devolvendo "YYYY-MM-01". */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
}

/**
 * Parcelas FUTURAS de uma compra parcelada. Recebe o vencimento da parcela atual
 * (`current` de `total`) e gera as parcelas current+1 … total, mantendo o dia do
 * vencimento (ajustado ao último dia do mês quando o mês é mais curto).
 * Atravessa o ano normalmente (dez → jan).
 */
export function futureInstallments(args: {
  dueDate: string;
  current: number;
  total: number;
}): Installment[] {
  const { dueDate, current, total } = args;
  const [y, m, d] = dueDate.split("-").map(Number) as [number, number, number];
  const base = `${y}-${pad(m)}-01`;
  const out: Installment[] = [];
  for (let n = current + 1; n <= total; n++) {
    const referenceMonth = addMonths(base, n - current);
    const [ry, rm] = referenceMonth.split("-").map(Number) as [number, number];
    const day = Math.min(d, daysInMonth(ry, rm));
    out.push({ number: n, total, referenceMonth, dueDate: `${ry}-${pad(rm)}-${pad(day)}` });
  }
  return out;
}
