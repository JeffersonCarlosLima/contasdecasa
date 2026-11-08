import { z } from "zod";

export const createFamilySchema = z.object({
  name: z
    .string({ message: "Nome da família é obrigatório" })
    .trim()
    .min(2, "Nome da família deve ter pelo menos 2 caracteres")
    .max(100, "Nome da família deve ter no máximo 100 caracteres"),
  kinship: z
    .enum(["titular", "conjuge", "filho", "outro"] as const, {
      message: "Parentesco inválido",
    })
    .default("titular"),
  splitRule: z
    .enum(["igual", "proporcional", "personalizada"] as const, {
      message: "Regra de divisão inválida",
    })
    .default("igual"),
  inviteEmail: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().toLowerCase().email("Email do convite inválido").optional()
  ),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;

export const acceptInviteSchema = z.object({
  token: z
    .string({ message: "Token do convite é obrigatório" })
    .trim()
    .min(1, "Token do convite é obrigatório"),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
