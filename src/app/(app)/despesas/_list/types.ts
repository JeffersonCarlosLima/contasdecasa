import type { DisplayStatus } from "@/lib/dates";
import type {
  ExpenseGroup,
  ExpenseItem,
  ListExpensesResult,
} from "@/lib/expense-queries";

export type { ExpenseGroup, ExpenseItem, ListExpensesResult };

export type ViewMode = "pessoa" | "data";

export interface ExpenseFiltersState {
  month: string;
  mode: ViewMode;
  status?: DisplayStatus | null;
  categoryId?: string | null;
  memberId?: string | null; // "todos" | "familia" | memberUUID
}
