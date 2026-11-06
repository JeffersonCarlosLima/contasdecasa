export const TIMEZONE = "America/Araguaina";

/** Hoje (YYYY-MM-DD) no fuso da família. */
export function todayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA → YYYY-MM-DD
}

/** Mês corrente "YYYY-MM" no fuso da família. */
export const currentMonth = (now: Date = new Date()) => todayISO(now).slice(0, 7);

/** "Atrasado" = pendente com vencimento antes de hoje. */
export function isOverdue(
  e: { status: "pendente" | "pago"; dueDate: string },
  today: string = todayISO(),
): boolean {
  return e.status === "pendente" && e.dueDate < today;
}

export type DisplayStatus = "pago" | "pendente" | "atrasado";
export function displayStatus(
  e: { status: "pendente" | "pago"; dueDate: string },
  today?: string,
): DisplayStatus {
  if (e.status === "pago") return "pago";
  return isOverdue(e, today) ? "atrasado" : "pendente";
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-11" → "Novembro 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const name = MONTHS[m - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** Valida o parâmetro ?mes=YYYY-MM; inválido → mês corrente. */
export function parseMonthParam(value: string | undefined): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

/** "2026-11-10" → "10/11" */
export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
