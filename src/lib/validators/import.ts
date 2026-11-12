import { z } from "zod";

export const MAX_DESCRIPTION_LENGTH = 120;

const displayNameField = z
  .string()
  .trim()
  .max(MAX_DESCRIPTION_LENGTH, "Nome muito longo")
  .nullable()
  .optional();

export const saveMappingSchema = z.object({
  name: z
    .string({ message: "Nome do mapeamento é obrigatório" })
    .trim()
    .min(1, "Nome não pode ser vazio")
    .max(100, "Nome muito longo"),
  config: z.object({
    separator: z.enum([";", ",", "\t"] as const, { message: "Separador inválido" }),
    headerSignature: z.array(z.string()),
    dateColumn: z.string().min(1, "Coluna de data é obrigatória"),
    dateFormat: z.enum(["dd/mm/yyyy", "yyyy-mm-dd", "dd/mm/yy"] as const, {
      message: "Formato de data inválido",
    }),
    descriptionColumns: z
      .array(z.string())
      .min(1, "Pelo menos uma coluna de descrição é obrigatória"),
    amountColumn: z.string().optional(),
    creditColumn: z.string().optional(),
    debitColumn: z.string().optional(),
    externalIdColumn: z.string().optional(),
    decimal: z.enum([",", "."] as const, { message: "Separador decimal inválido" }),
  }),
});

export const updateRowsSchema = z.object({
  batchId: z.string().uuid("ID de lote inválido"),
  rowIds: z
    .array(z.string().uuid("ID de linha inválido"))
    .min(1, "Selecione pelo menos uma linha"),
  patch: z.object({
    type: z.enum(["despesa", "receita", "salario", "ignorar"] as const).optional(),
    categoryId: z.string().uuid("ID de categoria inválido").nullable().optional(),
    ownerId: z.string().uuid("ID de membro inválido").nullable().optional(),
    selected: z.boolean().optional(),
    /** Descrição final do lançamento; nulo/vazio volta para a descrição do extrato. */
    description: z
      .string()
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, "Descrição muito longa")
      .nullable()
      .optional(),
  }),
});

export const setRowLinkSchema = z.object({
  batchId: z.string().uuid("ID de lote inválido"),
  rowId: z.string().uuid("ID de linha inválido"),
  expenseId: z.string().uuid("ID de despesa inválido").nullable(),
});

export const createRuleFromRowSchema = z.object({
  batchId: z.string().uuid("ID de lote inválido"),
  rowId: z.string().uuid("ID de linha inválido"),
  matchType: z.enum(["contem", "comeca"] as const, { message: "Tipo de correspondência inválido" }),
  pattern: z
    .string({ message: "Padrão de texto é obrigatório" })
    .trim()
    .min(1, "Padrão de texto não pode ser vazio")
    .max(200, "Padrão muito longo"),
  categoryId: z.string().uuid("Categoria é obrigatória"),
  displayName: displayNameField,
  ownerId: z.string().uuid("ID de membro inválido").nullable().optional(),
  paymentMethodId: z.string().uuid("ID de forma de pagamento inválido").nullable().optional(),
});

export const saveRuleSchema = z.object({
  id: z.string().uuid("ID de regra inválido").optional(),
  matchType: z
    .enum(["contem", "comeca"] as const, { message: "Tipo de correspondência inválido" })
    .default("contem"),
  pattern: z
    .string({ message: "Padrão é obrigatório" })
    .trim()
    .min(1, "Padrão não pode ser vazio")
    .max(200, "Padrão muito longo"),
  categoryId: z.string().uuid("Categoria é obrigatória"),
  displayName: displayNameField,
  ownerMemberId: z.string().uuid("ID de membro inválido").nullable().optional(),
  paymentMethodId: z.string().uuid("ID de forma de pagamento inválido").nullable().optional(),
  priority: z.number().int("Prioridade deve ser um número inteiro").default(0),
});

export const batchIdSchema = z.string().uuid("ID de lote inválido");
export const rowIdSchema = z.string().uuid("ID de linha inválido");
export const ruleIdSchema = z.string().uuid("ID de regra inválido");

export type SaveMappingInput = z.infer<typeof saveMappingSchema>;
export type UpdateRowsInput = z.infer<typeof updateRowsSchema>;
export type SetRowLinkInput = z.infer<typeof setRowLinkSchema>;
export type CreateRuleFromRowInput = z.infer<typeof createRuleFromRowSchema>;
export type SaveRuleInput = z.input<typeof saveRuleSchema>;
