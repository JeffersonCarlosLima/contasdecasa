import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cents, id, timestamps } from "./columns";
import { expenseStatus, investMode, splitRule } from "./enums";
import { categories, families, familyMembers, paymentMethods } from "./family";

export const monthlyPeriods = pgTable(
  "monthly_periods",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** Sempre o dia 1 do mês. */
    month: date("month", { mode: "string" }).notNull(),
    investMode: investMode("invest_mode").notNull().default("valor"),
    /** Centavos (modo valor) ou pontos-base (modo percentual). */
    investValue: cents("invest_value").notNull().default(0),
    investDestination: text("invest_destination"),
    /** Nulo = usa a regra padrão da família. */
    splitRule: splitRule("split_rule"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => familyMembers.id),
    ...timestamps,
  },
  (t) => [
    unique("monthly_periods_family_month_uq").on(t.familyId, t.month),
    check("monthly_periods_month_day1", sql`extract(day from ${t.month}) = 1`),
  ],
);

export const memberIncomes = pgTable(
  "member_incomes",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    periodId: uuid("period_id")
      .notNull()
      .references(() => monthlyPeriods.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => familyMembers.id),
    salaryCents: cents("salary_cents").notNull().default(0),
    extraCents: cents("extra_cents").notNull().default(0),
    ...timestamps,
  },
  (t) => [unique("member_incomes_period_member_uq").on(t.periodId, t.memberId)],
);

export const recurringExpenses = pgTable("recurring_expenses", {
  id: id(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amountCents: cents("amount_cents").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  /** Nulo = despesa da Família. */
  ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  dueDay: smallint("due_day").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const expenses = pgTable(
  "expenses",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** Dia 1 do mês de referência. */
    referenceMonth: date("reference_month", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    amountCents: cents("amount_cents").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    /** Nulo = despesa da Família (compartilhada). */
    ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
    createdByMemberId: uuid("created_by_member_id")
      .notNull()
      .references(() => familyMembers.id),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: expenseStatus("status").notNull().default("pendente"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidByMemberId: uuid("paid_by_member_id").references(() => familyMembers.id),
    installmentGroupId: uuid("installment_group_id"),
    installmentNumber: integer("installment_number"),
    installmentTotal: integer("installment_total"),
    recurringId: uuid("recurring_id").references(() => recurringExpenses.id),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("expenses_family_month_idx").on(t.familyId, t.referenceMonth),
    index("expenses_family_due_idx").on(t.familyId, t.dueDate),
    index("expenses_installment_group_idx").on(t.installmentGroupId),
  ],
);
