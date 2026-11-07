"use client";

import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseMobileList } from "./ExpenseMobileList";
import { ExpenseTable } from "./ExpenseTable";
import type { ExpenseGroup, ExpenseItem, ViewMode } from "./types";
import type { DisplayStatus } from "@/lib/dates";

export interface ExpenseListViewProps {
  mode: ViewMode;
  month: string;
  currentStatus: DisplayStatus | null;
  currentCategory: string | null;
  currentMember: string | null;
  categories: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; displayName: string; color: string }>;
  items: ExpenseItem[];
  groups: ExpenseGroup[];
  closed?: boolean;
  splitDescription?: string;
}

export function ExpenseListView({
  mode,
  month,
  currentStatus,
  currentCategory,
  currentMember,
  categories,
  members,
  items,
  groups,
  closed = false,
  splitDescription,
}: ExpenseListViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ExpenseFilters
        currentMode={mode}
        currentStatus={currentStatus}
        currentCategory={currentCategory}
        currentMember={currentMember}
        categories={categories}
        members={members}
      />

      <ExpenseTable
        mode={mode}
        items={items}
        groups={groups}
        month={month}
        closed={closed}
        splitDescription={splitDescription}
      />

      <ExpenseMobileList
        mode={mode}
        items={items}
        groups={groups}
        closed={closed}
      />
    </div>
  );
}
