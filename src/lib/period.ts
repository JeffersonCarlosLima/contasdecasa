import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { monthlyPeriods } from "@/db/schema";

export class MonthClosedError extends Error {
  constructor(month: string) {
    const formatted = month.slice(0, 7);
    super(`O mês ${formatted} está fechado para edição.`);
    this.name = "MonthClosedError";
  }
}

/**
 * Normaliza formato "AAAA-MM" ou "AAAA-MM-DD" para "AAAA-MM-01" exigido pelo campo date do banco.
 */
export function toMonthDate(month: string): string {
  const clean = month.trim();
  const match = clean.match(/^(\d{4}-(?:0[1-9]|1[0-2]))/);
  if (match) {
    return `${match[1]}-01`;
  }
  return clean;
}

/**
 * Normaliza "AAAA-MM-01" para "AAAA-MM".
 */
export function toMonthKey(monthDate: string): string {
  return monthDate.slice(0, 7);
}

/**
 * Verifica se um mês está fechado para edição.
 */
export async function isMonthClosed(familyId: string, month: string): Promise<boolean> {
  const monthDate = toMonthDate(month);
  const [period] = await db
    .select({ closedAt: monthlyPeriods.closedAt })
    .from(monthlyPeriods)
    .where(
      and(
        eq(monthlyPeriods.familyId, familyId),
        eq(monthlyPeriods.month, monthDate),
      ),
    )
    .limit(1);

  return Boolean(period?.closedAt);
}

/**
 * Lança erro em pt-BR se o mês estiver fechado.
 * Deve ser chamado por todas as actions que alteram dados do mês.
 */
export async function assertMonthOpen(familyId: string, month: string): Promise<void> {
  const closed = await isMonthClosed(familyId, month);
  if (closed) {
    throw new MonthClosedError(month);
  }
}
