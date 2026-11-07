import { z } from "zod";

export const renameFamilySchema = z.object({
  name: z
    .string({ message: "Nome da família é obrigatório" })
    .trim()
    .min(2, "Nome da família deve ter pelo menos 2 caracteres")
    .max(100, "Nome da família deve ter no máximo 100 caracteres"),
});

export const inviteMemberSchema = z.object({
  email: z
    .string({ message: "Email é obrigatório" })
    .trim()
    .email("Email inválido")
    .toLowerCase(),
  role: z
    .enum(["admin", "membro"] as const, {
      message: "O papel deve ser admin ou membro",
    })
    .default("membro"),
  kinship: z
    .enum(["titular", "conjuge", "filho", "outro"] as const, {
      message: "Parentesco inválido",
    })
    .default("outro"),
  participatesInSplit: z.boolean().default(true),
});

export const resendInviteSchema = z.object({
  inviteId: z.string().uuid("ID de convite inválido"),
});

export const cancelInviteSchema = z.object({
  inviteId: z.string().uuid("ID de convite inválido"),
});

export const addDependentSchema = z.object({
  displayName: z
    .string({ message: "Nome de exibição é obrigatório" })
    .trim()
    .min(1, "Nome de exibição é obrigatório")
    .max(100, "Nome de exibição muito longo"),
  kinship: z
    .enum(["titular", "conjuge", "filho", "outro"] as const, {
      message: "Parentesco inválido",
    })
    .default("outro"),
  participatesInSplit: z.boolean().default(true),
});

export const updateMemberSchema = z.object({
  memberId: z.string().uuid("ID de membro inválido"),
  displayName: z
    .string()
    .trim()
    .min(1, "Nome de exibição não pode ser vazio")
    .max(100, "Nome de exibição muito longo")
    .optional(),
  role: z.enum(["admin", "membro"] as const).optional(),
  color: z.enum(["person-a", "person-b", "person-c", "person-d"] as const).optional(),
  kinship: z.enum(["titular", "conjuge", "filho", "outro"] as const).optional(),
  participatesInSplit: z.boolean().optional(),
  customPercent: z
    .number()
    .int("Percentual deve ser um número inteiro em pontos-base")
    .min(0, "Percentual não pode ser negativo")
    .max(10000, "Percentual máximo é 100% (10000 pontos-base)")
    .nullable()
    .optional(),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid("ID de membro inválido"),
});

export const transferOwnershipSchema = z.object({
  memberId: z.string().uuid("ID de membro inválido"),
});

export type RenameFamilyInput = z.infer<typeof renameFamilySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ResendInviteInput = z.infer<typeof resendInviteSchema>;
export type CancelInviteInput = z.infer<typeof cancelInviteSchema>;
export type AddDependentInput = z.infer<typeof addDependentSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
