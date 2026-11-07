import { z } from "zod";

export const saveExpenseSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])(-01)?$/, "Mês deve estar no formato AAAA-MM"),
  description: z
    .string({ message: "Descrição é obrigatória" })
    .trim()
    .min(1, "Descrição é obrigatória")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  amountCents: z
    .number({ message: "Valor é obrigatório" })
    .int("Valor deve ser em centavos inteiros")
    .min(1, "Informe um valor maior que zero."),
  categoryId: z.string({ message: "Categoria é obrigatória" }).uuid("Categoria inválida"),
  ownerMemberId: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined || val === "familia" ? null : val),
      z.string().uuid("Membro inválido").nullable().optional()
    )
    .default(null),
  paymentMethodId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().uuid("Forma de pagamento inválida").nullable().optional()
  ),
  dueDate: z
    .string({ message: "Data de vencimento é obrigatória" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de vencimento deve estar no formato AAAA-MM-DD"),
  paid: z.boolean().default(false),
  paidByMemberId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().uuid("Membro pagador inválido").nullable().optional()
  ),
  installment: z
    .object({
      current: z.number().int().min(1, "Parcela atual deve ser >= 1"),
      total: z.number().int().min(1, "Total de parcelas deve ser >= 1"),
    })
    .refine((data) => data.current <= data.total, {
      message: "A parcela atual não pode ser maior que o total de parcelas.",
    })
    .nullable()
    .optional(),
  recurring: z.boolean().default(false),
  notes: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : String(val).trim()),
    z.string().max(500, "Observação deve ter no máximo 500 caracteres").nullable().optional()
  ),
  scope: z.enum(["esta", "proximas"] as const).optional(),
});

export type SaveExpenseInput = z.input<typeof saveExpenseSchema>;
export type SaveExpenseOutput = z.output<typeof saveExpenseSchema>;

export const deleteExpenseSchema = z.object({
  id: z.string({ message: "ID é obrigatório" }).uuid("ID inválido"),
  scope: z.enum(["esta", "proximas"] as const).default("esta"),
});

export type DeleteExpenseInput = z.input<typeof deleteExpenseSchema>;
export type DeleteExpenseOutput = z.output<typeof deleteExpenseSchema>;

export const markPaidSchema = z.object({
  id: z.string({ message: "ID é obrigatório" }).uuid("ID inválido"),
});

export type MarkPaidInput = z.input<typeof markPaidSchema>;
export type MarkPaidOutput = z.output<typeof markPaidSchema>;
