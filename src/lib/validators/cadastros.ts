import { z } from "zod";

export const CATEGORY_COLORS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
] as const;

export const CATEGORY_NATURES = ["fixa", "variavel"] as const;

export const PAYMENT_TYPES = ["cartao", "conta", "pix", "dinheiro"] as const;

export const saveCategorySchema = z.object({
  id: z.string().uuid("ID da categoria inválido").optional(),
  name: z
    .string({ message: "Nome da categoria é obrigatório" })
    .trim()
    .min(1, "Nome da categoria é obrigatório")
    .max(100, "Nome da categoria deve ter no máximo 100 caracteres"),
  color: z.enum(CATEGORY_COLORS, { message: "Cor inválida" }),
  nature: z.enum(CATEGORY_NATURES, { message: "Natureza inválida" }),
  monthlyLimitCents: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z
      .number({ message: "Limite mensal deve ser um número" })
      .int("Limite mensal deve ser em centavos inteiros")
      .min(0, "Limite mensal não pode ser negativo")
      .nullable()
      .optional()
  ),
});

export type SaveCategoryInput = z.infer<typeof saveCategorySchema>;

export const archiveCategorySchema = z.object({
  id: z.string({ message: "ID da categoria é obrigatório" }).uuid("ID da categoria inválido"),
});

export type ArchiveCategoryInput = z.infer<typeof archiveCategorySchema>;

export const savePaymentMethodSchema = z
  .object({
    id: z.string().uuid("ID da forma de pagamento inválido").optional(),
    name: z
      .string({ message: "Nome da forma de pagamento é obrigatório" })
      .trim()
      .min(1, "Nome da forma de pagamento é obrigatório")
      .max(100, "Nome da forma de pagamento deve ter no máximo 100 caracteres"),
    type: z.enum(PAYMENT_TYPES, { message: "Tipo inválido" }),
    ownerMemberId: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.string().uuid("ID do membro inválido").nullable().optional()
    ),
    cardLast4: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : String(val).trim()),
      z
        .string()
        .regex(/^[0-9]{4}$/, "Final do cartão deve conter exatamente 4 dígitos numéricos")
        .nullable()
        .optional()
    ),
    closingDay: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z
        .number({ message: "Dia de fechamento inválido" })
        .int("Dia de fechamento deve ser um número inteiro")
        .min(1, "Dia de fechamento deve ser entre 1 e 31")
        .max(31, "Dia de fechamento deve ser entre 1 e 31")
        .nullable()
        .optional()
    ),
    dueDay: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z
        .number({ message: "Dia de vencimento inválido" })
        .int("Dia de vencimento deve ser um número inteiro")
        .min(1, "Dia de vencimento deve ser entre 1 e 31")
        .max(31, "Dia de vencimento deve ser entre 1 e 31")
        .nullable()
        .optional()
    ),
  })
  .superRefine((data, ctx) => {
    const hasClosing = data.closingDay !== null && data.closingDay !== undefined;
    const hasDue = data.dueDay !== null && data.dueDay !== undefined;
    if (hasClosing !== hasDue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dia de fechamento e dia de vencimento devem ser preenchidos juntos",
        path: [hasClosing ? "dueDay" : "closingDay"],
      });
    }
  })
  .transform((data) => {
    if (data.type !== "cartao") {
      return {
        ...data,
        cardLast4: null,
        closingDay: null,
        dueDay: null,
      };
    }
    return {
      ...data,
      cardLast4: data.cardLast4 ?? null,
      closingDay: data.closingDay ?? null,
      dueDay: data.dueDay ?? null,
    };
  });

export type SavePaymentMethodInput = z.input<typeof savePaymentMethodSchema>;
export type SavePaymentMethodData = z.output<typeof savePaymentMethodSchema>;

export const setPaymentMethodArchivedSchema = z.object({
  id: z.string({ message: "ID da forma de pagamento é obrigatório" }).uuid("ID da forma de pagamento inválido"),
  archived: z.boolean({ message: "Status de arquivamento inválido" }),
});

export type SetPaymentMethodArchivedInput = z.infer<typeof setPaymentMethodArchivedSchema>;
