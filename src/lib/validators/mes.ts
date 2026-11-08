import { z } from "zod";

export const monthParamSchema = z.object({
  month: z
    .string({ message: "Mês é obrigatório" })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido (formato esperado: AAAA-MM)"),
});

export const memberIncomeInputSchema = z.object({
  memberId: z.string().uuid("ID de membro inválido"),
  salaryCents: z
    .number({ message: "Salário deve ser informado" })
    .int("Salário deve ser em centavos inteiros")
    .min(0, "Salário não pode ser negativo")
    .default(0),
  extraCents: z
    .number({ message: "Renda extra deve ser informada" })
    .int("Renda extra deve ser em centavos inteiros")
    .min(0, "Renda extra não pode ser negativa")
    .default(0),
});

export const saveMonthCloseSchema = z.object({
  month: z
    .string({ message: "Mês é obrigatório" })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido (formato esperado: AAAA-MM)"),
  incomes: z.array(memberIncomeInputSchema).default([]),
  investMode: z
    .enum(["valor", "percentual"] as const, {
      message: "Modo de investimento inválido (valor ou percentual)",
    })
    .default("valor"),
  investValue: z
    .number({ message: "Valor de investimento deve ser informado" })
    .int("Investimento deve ser um número inteiro")
    .min(0, "Investimento não pode ser negativo")
    .default(0),
  investDestination: z
    .string()
    .trim()
    .max(100, "Destino muito longo")
    .nullable()
    .optional()
    .default(null)
    .transform((val) => val || null),
  splitRule: z
    .enum(["igual", "proporcional", "personalizada"] as const, {
      message: "Regra de divisão inválida",
    })
    .default("igual"),
});

export type MonthParamInput = z.input<typeof monthParamSchema>;
export type MemberIncomeInput = z.input<typeof memberIncomeInputSchema>;
export type SaveMonthCloseInput = z.input<typeof saveMonthCloseSchema>;
