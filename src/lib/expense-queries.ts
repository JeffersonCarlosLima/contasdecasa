import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { categories, expenses, familyMembers, paymentMethods } from "@/db/schema";
import { displayStatus, type DisplayStatus } from "@/lib/dates";
import { toMonthDate } from "@/lib/period";

export interface ExpenseItem {
  id: string;
  description: string;
  amountCents: number;
  category: {
    id: string;
    name: string;
    color: string;
  };
  owner: {
    id: string;
    displayName: string;
    color: string;
    removed: boolean;
  } | null;
  paymentMethod: {
    id: string;
    name: string;
  } | null;
  dueDate: string;
  status: DisplayStatus;
  paidAt: Date | null;
  paidBy: {
    id: string;
    displayName: string;
  } | null;
  installment: {
    current: number;
    total: number;
  } | null;
  recurring: boolean;
  notes: string | null;
  referenceMonth: string;
}

export interface ExpenseGroup {
  owner: {
    id: string;
    displayName: string;
    color: string;
    removed: boolean;
  } | null;
  items: ExpenseItem[];
  subtotalCents: number;
  paidCents: number;
  pendingCents: number;
}

export interface ListExpensesResult {
  items: ExpenseItem[];
  totals: {
    count: number;
    totalCents: number;
    pendingCents: number;
  };
  groups: ExpenseGroup[];
}

export interface ListExpensesFilters {
  memberId?: string | null;
  categoryId?: string | null;
  status?: DisplayStatus | null;
}

export async function listExpenses(
  familyId: string,
  month: string,
  filters: ListExpensesFilters = {}
): Promise<ListExpensesResult> {
  const monthDate = toMonthDate(month);

  // 1. Carregar todos os membros da família para mapeamento de owner, paidBy e criação de grupos
  const allFamilyMembers = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, familyId));

  const memberMap = new Map(allFamilyMembers.map((m) => [m.id, m]));

  // 2. Buscar despesas do mês não excluídas
  const rows = await db
    .select({
      expense: expenses,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      },
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
    .where(
      and(
        eq(expenses.familyId, familyId),
        eq(expenses.referenceMonth, monthDate),
        isNull(expenses.deletedAt)
      )
    )
    .orderBy(expenses.dueDate, desc(expenses.createdAt));

  // 3. Mapear para ExpenseItem com status calculado
  let items: ExpenseItem[] = rows.map((row) => {
    const ownerRecord = row.expense.ownerMemberId
      ? memberMap.get(row.expense.ownerMemberId)
      : null;

    const paidByRecord = row.expense.paidByMemberId
      ? memberMap.get(row.expense.paidByMemberId)
      : null;

    const calcStatus = displayStatus({
      status: row.expense.status,
      dueDate: row.expense.dueDate,
    });

    const installment =
      row.expense.installmentNumber && row.expense.installmentTotal
        ? {
            current: row.expense.installmentNumber,
            total: row.expense.installmentTotal,
          }
        : null;

    return {
      id: row.expense.id,
      description: row.expense.description,
      amountCents: row.expense.amountCents,
      category: {
        id: row.category.id,
        name: row.category.name,
        color: row.category.color,
      },
      owner: ownerRecord
        ? {
            id: ownerRecord.id,
            displayName: ownerRecord.displayName,
            color: ownerRecord.color,
            removed: ownerRecord.status === "removido",
          }
        : null,
      paymentMethod: row.paymentMethod?.id
        ? {
            id: row.paymentMethod.id,
            name: row.paymentMethod.name,
          }
        : null,
      dueDate: row.expense.dueDate,
      status: calcStatus,
      paidAt: row.expense.paidAt,
      paidBy: paidByRecord
        ? {
            id: paidByRecord.id,
            displayName: paidByRecord.displayName,
          }
        : null,
      installment,
      recurring: Boolean(row.expense.recurringId),
      notes: row.expense.notes,
      referenceMonth: row.expense.referenceMonth,
    };
  });

  // 4. Aplicar filtros em memória (incluindo status calculado atrasado/pendente/pago)
  if (filters.categoryId) {
    items = items.filter((item) => item.category.id === filters.categoryId);
  }

  if (filters.memberId !== undefined && filters.memberId !== null) {
    if (filters.memberId === "familia" || filters.memberId === "") {
      items = items.filter((item) => item.owner === null);
    } else {
      items = items.filter((item) => item.owner?.id === filters.memberId);
    }
  }

  if (filters.status) {
    items = items.filter((item) => item.status === filters.status);
  }

  // 5. Totais
  const totalCents = items.reduce((acc, item) => acc + item.amountCents, 0);
  const pendingCents = items
    .filter((item) => item.status !== "pago")
    .reduce((acc, item) => acc + item.amountCents, 0);

  // 6. Grupos por pessoa (todos os membros ativos + removidos que possuem despesas + Família)
  const activeMembers = allFamilyMembers.filter((m) => m.status !== "removido");
  const removedMembersWithExpenses = allFamilyMembers.filter(
    (m) => m.status === "removido" && items.some((item) => item.owner?.id === m.id)
  );

  const groupOwners: Array<{
    id: string;
    displayName: string;
    color: string;
    removed: boolean;
  } | null> = [
    ...activeMembers.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      color: m.color,
      removed: false,
    })),
    ...removedMembersWithExpenses.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      color: m.color,
      removed: true,
    })),
    null, // Família
  ];

  const groups: ExpenseGroup[] = groupOwners.map((owner) => {
    const groupItems = items.filter((item) =>
      owner === null ? item.owner === null : item.owner?.id === owner.id
    );

    const subtotalCents = groupItems.reduce((acc, item) => acc + item.amountCents, 0);
    const paidCents = groupItems
      .filter((item) => item.status === "pago")
      .reduce((acc, item) => acc + item.amountCents, 0);
    const groupPendingCents = groupItems
      .filter((item) => item.status !== "pago")
      .reduce((acc, item) => acc + item.amountCents, 0);

    return {
      owner,
      items: groupItems,
      subtotalCents,
      paidCents,
      pendingCents: groupPendingCents,
    };
  });

  return {
    items,
    totals: {
      count: items.length,
      totalCents,
      pendingCents,
    },
    groups,
  };
}

export async function getExpense(familyId: string, id: string): Promise<ExpenseItem | null> {
  const [row] = await db
    .select({
      expense: expenses,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
      paymentMethod: {
        id: paymentMethods.id,
        name: paymentMethods.name,
      },
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.familyId, familyId),
        isNull(expenses.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const allFamilyMembers = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, familyId));

  const memberMap = new Map(allFamilyMembers.map((m) => [m.id, m]));

  const ownerRecord = row.expense.ownerMemberId
    ? memberMap.get(row.expense.ownerMemberId)
    : null;

  const paidByRecord = row.expense.paidByMemberId
    ? memberMap.get(row.expense.paidByMemberId)
    : null;

  const calcStatus = displayStatus({
    status: row.expense.status,
    dueDate: row.expense.dueDate,
  });

  const installment =
    row.expense.installmentNumber && row.expense.installmentTotal
      ? {
          current: row.expense.installmentNumber,
          total: row.expense.installmentTotal,
        }
      : null;

  return {
    id: row.expense.id,
    description: row.expense.description,
    amountCents: row.expense.amountCents,
    category: {
      id: row.category.id,
      name: row.category.name,
      color: row.category.color,
    },
    owner: ownerRecord
      ? {
          id: ownerRecord.id,
          displayName: ownerRecord.displayName,
          color: ownerRecord.color,
          removed: ownerRecord.status === "removido",
        }
      : null,
    paymentMethod: row.paymentMethod?.id
      ? {
          id: row.paymentMethod.id,
          name: row.paymentMethod.name,
        }
      : null,
    dueDate: row.expense.dueDate,
    status: calcStatus,
    paidAt: row.expense.paidAt,
    paidBy: paidByRecord
      ? {
          id: paidByRecord.id,
          displayName: paidByRecord.displayName,
        }
      : null,
    installment,
    recurring: Boolean(row.expense.recurringId),
    notes: row.expense.notes,
    referenceMonth: row.expense.referenceMonth,
  };
}
