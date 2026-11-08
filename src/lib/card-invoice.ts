/**
 * Regra de fatura de cartão de crédito.
 *
 * Conforme Decisão 3 do Plano de Formas de Pagamento:
 * - Compra com dia <= fechamento entra na fatura que fecha no mesmo mês.
 * - Compra com dia > fechamento entra na fatura do mês seguinte.
 * - Vencimento = dia de vencimento no mesmo mês do fechamento se vencimento > fechamento, senão no mês seguinte.
 * - Dia inexistente é ajustado ao último dia do mês (ex: 31 em abril -> 30, em fevereiro -> 28 ou 29).
 * - referenceMonth = dia 1 do mês do VENCIMENTO ("YYYY-MM-01").
 * - dueDate = data do vencimento ("YYYY-MM-DD").
 */

export interface CardInvoiceInput {
  purchaseDate: string; // "YYYY-MM-DD"
  closingDay: number; // 1..31
  dueDay: number; // 1..31
}

export interface CardInvoiceResult {
  referenceMonth: string; // "YYYY-MM-01"
  dueDate: string; // "YYYY-MM-DD"
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function cardInvoice({
  purchaseDate,
  closingDay,
  dueDay,
}: CardInvoiceInput): CardInvoiceResult {
  const datePart = purchaseDate.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`Data de compra inválida: ${purchaseDate}`);
  }

  if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
    throw new Error(`Dias de fechamento (${closingDay}) e vencimento (${dueDay}) devem estar entre 1 e 31.`);
  }

  // 1. Mês e ano de fechamento da fatura
  let closingYear = year;
  let closingMonth = month;

  if (day > closingDay) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  // 2. Mês e ano do vencimento da fatura
  let dueYear = closingYear;
  let dueMonth = closingMonth;

  if (dueDay <= closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  // 3. Ajuste de dia inexistente para o último dia do mês do vencimento
  const maxDays = daysInMonth(dueYear, dueMonth);
  const actualDueDay = Math.min(dueDay, maxDays);

  const dueDate = `${dueYear}-${pad2(dueMonth)}-${pad2(actualDueDay)}`;
  const referenceMonth = `${dueYear}-${pad2(dueMonth)}-01`;

  return {
    referenceMonth,
    dueDate,
  };
}
