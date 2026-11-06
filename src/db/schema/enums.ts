import { pgEnum } from "drizzle-orm/pg-core";

export const splitRule = pgEnum("split_rule", ["igual", "proporcional", "personalizada"]);
export const memberRole = pgEnum("member_role", ["dono", "admin", "membro"]);
export const kinship = pgEnum("kinship", ["titular", "conjuge", "filho", "outro"]);
export const personColor = pgEnum("person_color", ["person-a", "person-b", "person-c", "person-d"]);
export const memberStatus = pgEnum("member_status", ["ativo", "convidado", "removido"]);
export const categoryColor = pgEnum("category_color", [
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6",
]);
export const categoryNature = pgEnum("category_nature", ["fixa", "variavel"]);
export const paymentType = pgEnum("payment_type", ["cartao", "conta", "pix", "dinheiro"]);
export const investMode = pgEnum("invest_mode", ["valor", "percentual"]);
export const expenseStatus = pgEnum("expense_status", ["pendente", "pago"]);
