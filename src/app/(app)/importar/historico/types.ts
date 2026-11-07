export type BatchStatus = "rascunho" | "confirmado" | "desfeito";

export interface BatchTotals {
  expensesCents: number;
  incomesCents: number;
  count: number;
}

export interface ImportBatchItem {
  id: string;
  filename: string;
  fileSize: number;
  rowCount: number;
  layout: string;
  status: BatchStatus;
  paymentMethodName: string;
  ownerName?: string | null;
  importedByName: string;
  createdAt: string | Date;
  confirmedAt?: string | Date | null;
  undoneAt?: string | Date | null;
  totals?: BatchTotals;
}
