/**
 * Mês de referência (competência) do lote de importação.
 *
 * O usuário escolhe "MM/AAAA" ao enviar o extrato. Todo o lote é gravado nessa competência,
 * sem aplicar a regra de fechamento de fatura (que empurrava compras para o mês seguinte).
 * A data original de cada transação continua em `paid_at` / `import_rows.date`.
 *
 * Funções puras sobre strings: não usam `Date` local, então não sofrem com fuso horário.
 */

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MONTH_DATE = /^(\d{4})-(0[1-9]|1[0-2])-01$/;

/** "2026-11" → "2026-11-01"; inválido → null. Aceita também "2026-11-01". */
export function parseReferenceMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (MONTH_DATE.test(v)) return v;
  if (MONTH_KEY.test(v)) return `${v}-01`;
  return null;
}

/** "2026-11-01" → "11/2026". */
export function formatReferenceMonth(monthDate: string): string {
  return `${monthDate.slice(5, 7)}/${monthDate.slice(0, 4)}`;
}

/** "2026-11-01" → "novembro de 2026". */
export function referenceMonthLong(monthDate: string): string {
  const names = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const m = Number(monthDate.slice(5, 7));
  return `${names[m - 1] ?? ""} de ${monthDate.slice(0, 4)}`;
}

/** Vencimento no mês de referência, ajustando dia inexistente ao fim do mês. */
export function dueDateInMonth(monthDate: string, dueDay: number): string {
  const year = Number(monthDate.slice(0, 4));
  const month = Number(monthDate.slice(5, 7));
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Math.max(dueDay, 1), last);
  return `${monthDate.slice(0, 7)}-${String(day).padStart(2, "0")}`;
}
