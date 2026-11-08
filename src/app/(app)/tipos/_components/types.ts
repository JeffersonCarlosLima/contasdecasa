import type { categories, paymentMethods, familyMembers } from "@/db/schema";

export type CategoryItem = typeof categories.$inferSelect;
export type PaymentMethodItem = typeof paymentMethods.$inferSelect;
export type FamilyMemberItem = typeof familyMembers.$inferSelect;

export type CategoryColor =
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "chart-6";

export type CategoryNature = "fixa" | "variavel";

export type PaymentMethodType = "cartao" | "conta" | "pix" | "dinheiro";

export interface SaveCategoryInput {
  id?: string;
  name: string;
  color: CategoryColor;
  nature: CategoryNature;
  monthlyLimitCents?: number | null;
}

export interface SavePaymentMethodInput {
  id?: string;
  name: string;
  type: PaymentMethodType;
  ownerMemberId?: string | null;
  cardLast4?: string | null;
  closingDay?: number | null;
  dueDay?: number | null;
}

export interface SetPaymentMethodArchivedInput {
  id: string;
  archived: boolean;
}

export type ActionResponse =
  | { ok: true; [key: string]: unknown }
  | { ok: false; error: string };

export const COLOR_OPTIONS: Array<{
  color: CategoryColor;
  label: string;
}> = [
  { color: "chart-1", label: "Telha" },
  { color: "chart-2", label: "Folha" },
  { color: "chart-3", label: "Azul" },
  { color: "chart-4", label: "Mostarda" },
  { color: "chart-5", label: "Ameixa" },
  { color: "chart-6", label: "Ardósia" },
];

export const PAYMENT_TYPE_LABELS: Record<PaymentMethodType, string> = {
  cartao: "Cartão",
  conta: "Conta",
  pix: "Pix",
  dinheiro: "Dinheiro",
};
