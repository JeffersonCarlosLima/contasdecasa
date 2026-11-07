import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { cents, id, timestamps } from "./columns";
import { categories, families, familyMembers, paymentMethods } from "./family";
import { expenses, memberIncomes } from "./finance";

export const importBatchStatus = pgEnum("import_batch_status", [
  "rascunho",
  "confirmado",
  "desfeito",
]);

export const importRowType = pgEnum("import_row_type", [
  "despesa",
  "receita",
  "salario",
  "ignorar",
]);

export const importRowSituation = pgEnum("import_row_situation", [
  "nova",
  "duplicada",
  "possivel_vinculo",
]);

export const importRuleMatchType = pgEnum("import_rule_match_type", [
  "contem",
  "comeca",
]);

export const importBatches = pgTable(
  "import_batches",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    paymentMethodId: uuid("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),
    /** Nulo = despesa da Família (compartilhada). */
    ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
    layout: text("layout").notNull(),
    filename: text("filename").notNull(),
    fileSize: integer("file_size").notNull(),
    rowCount: integer("row_count").notNull().default(0),
    status: importBatchStatus("status").notNull().default("rascunho"),
    importedBy: uuid("imported_by")
      .notNull()
      .references(() => familyMembers.id),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by").references(() => familyMembers.id),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
    undoneBy: uuid("undone_by").references(() => familyMembers.id),
    ...timestamps,
  },
  (t) => [
    index("import_batches_family_idx").on(t.familyId),
    index("import_batches_family_created_idx").on(t.familyId, t.createdAt),
    index("import_batches_status_idx").on(t.status),
  ],
);

export const importRows = pgTable(
  "import_rows",
  {
    id: id(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatches.id, { onDelete: "cascade" }),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    lineNo: integer("line_no").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    descriptionOriginal: text("description_original").notNull(),
    descriptionNormalized: text("description_normalized").notNull(),
    /** Centavos com sinal: negativo = saída/despesa, positivo = entrada/receita. */
    amountCents: cents("amount_cents").notNull(),
    type: importRowType("type").notNull().default("despesa"),
    ignoreReason: text("ignore_reason"),
    categoryId: uuid("category_id").references(() => categories.id),
    ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    selected: boolean("selected").notNull().default(true),
    fingerprint: text("fingerprint").notNull(),
    situation: importRowSituation("situation").notNull().default("nova"),
    matchedExpenseId: uuid("matched_expense_id").references(() => expenses.id),
    linkedExpenseId: uuid("linked_expense_id").references(() => expenses.id),
    /** Par de transferência entre contas próprias no mesmo lote */
    linkedRowId: uuid("linked_row_id"),
    createdExpenseId: uuid("created_expense_id").references(() => expenses.id),
    targetMemberIncomeId: uuid("target_member_income_id").references(() => memberIncomes.id),
    appliedExtraCents: cents("applied_extra_cents"),
    previousSalaryCents: cents("previous_salary_cents"),
    ...timestamps,
  },
  (t) => [
    index("import_rows_batch_idx").on(t.batchId),
    index("import_rows_family_idx").on(t.familyId),
    index("import_rows_fingerprint_idx").on(t.familyId, t.fingerprint),
  ],
);

export const importRules = pgTable(
  "import_rules",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    matchType: importRuleMatchType("match_type").notNull().default("contem"),
    pattern: text("pattern").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    ownerMemberId: uuid("owner_member_id").references(() => familyMembers.id),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    priority: integer("priority").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("import_rules_family_idx").on(t.familyId),
    index("import_rules_family_priority_idx").on(t.familyId, t.priority),
  ],
);

export const importMappings = pgTable(
  "import_mappings",
  {
    id: id(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    config: jsonb("config").notNull(),
    ...timestamps,
  },
  (t) => [
    index("import_mappings_family_idx").on(t.familyId),
    uniqueIndex("import_mappings_family_name_uq").on(t.familyId, t.name),
  ],
);
