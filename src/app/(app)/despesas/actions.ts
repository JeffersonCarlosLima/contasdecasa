"use server";

import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { expenses, recurringExpenses } from "@/db/schema";
import { futureInstallments, futureRecurrences } from "@/lib/calc/installments";
import { assertMonthOpen, toMonthDate } from "@/lib/period";
import { requireMember } from "@/lib/session";
import {
  deleteExpenseSchema,
  markPaidSchema,
  saveExpenseSchema,
  type DeleteExpenseInput,
  type MarkPaidInput,
  type SaveExpenseInput,
} from "@/lib/validators/despesas";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function saveExpense(
  input: SaveExpenseInput,
  overrideScope?: "esta" | "proximas"
): Promise<ActionResult<{ id: string }>> {
  const { member, familyId } = await requireMember();

  const parsed = saveExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para despesa.",
    };
  }

  const data = parsed.data;
  const scope = overrideScope ?? data.scope ?? "esta";

  // 1. Checagem de mês aberto
  try {
    await assertMonthOpen(familyId, data.month);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "O mês está fechado para edição.",
    };
  }

  // 2. Permissão de membro comum: só lança próprias ou da Família (ownerMemberId: null)
  if (member.role === "membro") {
    if (data.ownerMemberId !== null && data.ownerMemberId !== member.id) {
      return {
        ok: false,
        error: "Você só pode lançar ou alterar despesas próprias ou da Família.",
      };
    }
  }

  const referenceMonthDate = toMonthDate(data.month);

  try {
    // 3. Edição
    if (data.id) {
      const [existing] = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.id, data.id),
            eq(expenses.familyId, familyId),
            isNull(expenses.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        return { ok: false, error: "Despesa não encontrada." };
      }

      if (member.role === "membro") {
        if (existing.ownerMemberId !== null && existing.ownerMemberId !== member.id) {
          return {
            ok: false,
            error: "Você só pode lançar ou alterar despesas próprias ou da Família.",
          };
        }
      }

      // Se for parcelada e scope === 'proximas'
      if (scope === "proximas" && existing.installmentGroupId && existing.installmentNumber) {
        await db
          .update(expenses)
          .set({
            description: data.description,
            amountCents: data.amountCents,
            categoryId: data.categoryId,
            ownerMemberId: data.ownerMemberId ?? null,
            paymentMethodId: data.paymentMethodId ?? null,
            notes: data.notes ?? null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(expenses.familyId, familyId),
              eq(expenses.installmentGroupId, existing.installmentGroupId),
              gte(expenses.installmentNumber, existing.installmentNumber),
              isNull(expenses.deletedAt)
            )
          );

        // Atualiza a parcela atual com seus campos específicos (vencimento, status, pago)
        await db
          .update(expenses)
          .set({
            dueDate: data.dueDate,
            referenceMonth: referenceMonthDate,
            status: data.paid ? "pago" : "pendente",
            paidAt: data.paid ? (existing.paidAt || new Date()) : null,
            paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(expenses.id, data.id),
              eq(expenses.familyId, familyId)
            )
          );

        return { ok: true, id: data.id };
      }

      // Despesa avulsa que virou parcelada na edição: vira a parcela atual e gera as futuras
      if (data.installment && !existing.installmentGroupId) {
        const inst = data.installment;
        const installmentGroupId = crypto.randomUUID();

        await db.transaction(async (tx) => {
          await tx
            .update(expenses)
            .set({
              description: data.description,
              amountCents: data.amountCents,
              categoryId: data.categoryId,
              ownerMemberId: data.ownerMemberId ?? null,
              paymentMethodId: data.paymentMethodId ?? null,
              dueDate: data.dueDate,
              referenceMonth: referenceMonthDate,
              status: data.paid ? "pago" : "pendente",
              paidAt: data.paid ? (existing.paidAt || new Date()) : null,
              paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
              installmentGroupId,
              installmentNumber: inst.current,
              installmentTotal: inst.total,
              notes: data.notes ?? null,
              updatedAt: new Date(),
            })
            .where(and(eq(expenses.id, data.id!), eq(expenses.familyId, familyId)));

          if (inst.current < inst.total) {
            const futureList = futureInstallments({
              dueDate: data.dueDate,
              current: inst.current,
              total: inst.total,
            });

            if (futureList.length > 0) {
              await tx.insert(expenses).values(
                futureList.map((fut) => ({
                  familyId,
                  referenceMonth: fut.referenceMonth,
                  dueDate: fut.dueDate,
                  description: data.description,
                  amountCents: data.amountCents,
                  categoryId: data.categoryId,
                  ownerMemberId: data.ownerMemberId ?? null,
                  createdByMemberId: member.id,
                  paymentMethodId: data.paymentMethodId ?? null,
                  status: "pendente" as const,
                  installmentGroupId,
                  installmentNumber: fut.number,
                  installmentTotal: inst.total,
                  notes: data.notes ?? null,
                }))
              );
            }
          }
        });

        return { ok: true, id: data.id };
      }

      // Despesa avulsa que virou recorrente na edição: cria o modelo e lança nos meses seguintes
      if (data.recurring && !data.installment && !existing.installmentGroupId && !existing.recurringId) {
        await db.transaction(async (tx) => {
          const [rec] = await tx
            .insert(recurringExpenses)
            .values({
              familyId,
              description: data.description,
              amountCents: data.amountCents,
              categoryId: data.categoryId,
              ownerMemberId: data.ownerMemberId ?? null,
              paymentMethodId: data.paymentMethodId ?? null,
              dueDay: Number(data.dueDate.slice(8, 10)),
              active: true,
            })
            .returning();
          const recurringId = rec?.id ?? null;

          await tx
            .update(expenses)
            .set({
              description: data.description,
              amountCents: data.amountCents,
              categoryId: data.categoryId,
              ownerMemberId: data.ownerMemberId ?? null,
              paymentMethodId: data.paymentMethodId ?? null,
              dueDate: data.dueDate,
              referenceMonth: referenceMonthDate,
              status: data.paid ? "pago" : "pendente",
              paidAt: data.paid ? (existing.paidAt || new Date()) : null,
              paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
              recurringId,
              notes: data.notes ?? null,
              updatedAt: new Date(),
            })
            .where(and(eq(expenses.id, data.id!), eq(expenses.familyId, familyId)));

          if (recurringId) {
            await tx.insert(expenses).values(
              futureRecurrences({ dueDate: data.dueDate }).map((fut) => ({
                familyId,
                referenceMonth: fut.referenceMonth,
                dueDate: fut.dueDate,
                description: data.description,
                amountCents: data.amountCents,
                categoryId: data.categoryId,
                ownerMemberId: data.ownerMemberId ?? null,
                createdByMemberId: member.id,
                paymentMethodId: data.paymentMethodId ?? null,
                status: "pendente" as const,
                recurringId,
                notes: data.notes ?? null,
              }))
            );
          }
        });

        return { ok: true, id: data.id };
      }

      // Edição simples ("esta")
      await db
        .update(expenses)
        .set({
          description: data.description,
          amountCents: data.amountCents,
          categoryId: data.categoryId,
          ownerMemberId: data.ownerMemberId ?? null,
          paymentMethodId: data.paymentMethodId ?? null,
          dueDate: data.dueDate,
          referenceMonth: referenceMonthDate,
          status: data.paid ? "pago" : "pendente",
          paidAt: data.paid ? (existing.paidAt || new Date()) : null,
          paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(expenses.id, data.id),
            eq(expenses.familyId, familyId)
          )
        );

      return { ok: true, id: data.id };
    }

    // 4. Criação
    let createdExpenseId = "";

    await db.transaction(async (tx) => {
      let recurringId: string | null = null;

      // Modelo recorrente em recurring_expenses
      if (data.recurring) {
        const dueDay = Number(data.dueDate.slice(8, 10));
        const [rec] = await tx
          .insert(recurringExpenses)
          .values({
            familyId,
            description: data.description,
            amountCents: data.amountCents,
            categoryId: data.categoryId,
            ownerMemberId: data.ownerMemberId ?? null,
            paymentMethodId: data.paymentMethodId ?? null,
            dueDay,
            active: true,
          })
          .returning();

        if (rec) {
          recurringId = rec.id;
        }
      }

      // Compra parcelada
      if (data.installment) {
        const installmentGroupId = crypto.randomUUID();

        // Parcela atual
        const [curr] = await tx
          .insert(expenses)
          .values({
            familyId,
            referenceMonth: referenceMonthDate,
            description: data.description,
            amountCents: data.amountCents,
            categoryId: data.categoryId,
            ownerMemberId: data.ownerMemberId ?? null,
            createdByMemberId: member.id,
            paymentMethodId: data.paymentMethodId ?? null,
            dueDate: data.dueDate,
            status: data.paid ? "pago" : "pendente",
            paidAt: data.paid ? new Date() : null,
            paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
            installmentGroupId,
            installmentNumber: data.installment.current,
            installmentTotal: data.installment.total,
            recurringId,
            notes: data.notes ?? null,
          })
          .returning();

        if (curr) {
          createdExpenseId = curr.id;
        }

        // Parcelas futuras
        if (data.installment.current < data.installment.total) {
          const futureList = futureInstallments({
            dueDate: data.dueDate,
            current: data.installment.current,
            total: data.installment.total,
          });

          if (futureList.length > 0) {
            await tx.insert(expenses).values(
              futureList.map((fut) => ({
                familyId,
                referenceMonth: fut.referenceMonth,
                dueDate: fut.dueDate,
                description: data.description,
                amountCents: data.amountCents,
                categoryId: data.categoryId,
                ownerMemberId: data.ownerMemberId ?? null,
                createdByMemberId: member.id,
                paymentMethodId: data.paymentMethodId ?? null,
                status: "pendente" as const,
                installmentGroupId,
                installmentNumber: fut.number,
                installmentTotal: data.installment!.total,
                notes: data.notes ?? null,
              }))
            );
          }
        }
      } else {
        // Despesa única normal
        const [single] = await tx
          .insert(expenses)
          .values({
            familyId,
            referenceMonth: referenceMonthDate,
            description: data.description,
            amountCents: data.amountCents,
            categoryId: data.categoryId,
            ownerMemberId: data.ownerMemberId ?? null,
            createdByMemberId: member.id,
            paymentMethodId: data.paymentMethodId ?? null,
            dueDate: data.dueDate,
            status: data.paid ? "pago" : "pendente",
            paidAt: data.paid ? new Date() : null,
            paidByMemberId: data.paid ? (data.paidByMemberId || member.id) : null,
            recurringId,
            notes: data.notes ?? null,
          })
          .returning();

        if (single) {
          createdExpenseId = single.id;
        }

        // Recorrente: já lança nos meses seguintes
        if (recurringId) {
          await tx.insert(expenses).values(
            futureRecurrences({ dueDate: data.dueDate }).map((fut) => ({
              familyId,
              referenceMonth: fut.referenceMonth,
              dueDate: fut.dueDate,
              description: data.description,
              amountCents: data.amountCents,
              categoryId: data.categoryId,
              ownerMemberId: data.ownerMemberId ?? null,
              createdByMemberId: member.id,
              paymentMethodId: data.paymentMethodId ?? null,
              status: "pendente" as const,
              recurringId,
              notes: data.notes ?? null,
            }))
          );
        }
      }
    });

    return { ok: true, id: createdExpenseId };
  } catch (error) {
    console.error("Erro ao salvar despesa:", error);
    return { ok: false, error: "Ocorreu um erro ao salvar a despesa." };
  }
}

export async function deleteExpense(
  idOrInput: string | DeleteExpenseInput,
  overrideScope?: "esta" | "proximas"
): Promise<ActionResult> {
  const { member, familyId } = await requireMember();

  const raw = typeof idOrInput === "string" ? { id: idOrInput } : idOrInput;
  const parsed = deleteExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "ID inválido para exclusão.",
    };
  }

  const { id } = parsed.data;
  const scope = overrideScope ?? parsed.data.scope ?? "esta";

  const [existing] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.familyId, familyId),
        isNull(expenses.deletedAt)
      )
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "Despesa não encontrada ou já excluída." };
  }

  // Permissão de membro
  if (member.role === "membro") {
    if (existing.ownerMemberId !== null && existing.ownerMemberId !== member.id) {
      return {
        ok: false,
        error: "Você só pode excluir despesas próprias ou da Família.",
      };
    }
  }

  // Mês aberto
  try {
    await assertMonthOpen(familyId, existing.referenceMonth);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "O mês desta despesa está fechado.",
    };
  }

  try {
    if (scope === "proximas" && existing.installmentGroupId && existing.installmentNumber) {
      await db
        .update(expenses)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(expenses.familyId, familyId),
            eq(expenses.installmentGroupId, existing.installmentGroupId),
            gte(expenses.installmentNumber, existing.installmentNumber),
            isNull(expenses.deletedAt)
          )
        );

      return { ok: true };
    }

    await db
      .update(expenses)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.familyId, familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return { ok: false, error: "Ocorreu um erro ao excluir a despesa." };
  }
}

export async function markPaid(idOrInput: string | MarkPaidInput): Promise<ActionResult> {
  const { member, familyId } = await requireMember();

  const raw = typeof idOrInput === "string" ? { id: idOrInput } : idOrInput;
  const parsed = markPaidSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "ID inválido.",
    };
  }

  const { id } = parsed.data;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.familyId, familyId),
        isNull(expenses.deletedAt)
      )
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "Despesa não encontrada." };
  }

  // Permissão de membro
  if (member.role === "membro") {
    if (existing.ownerMemberId !== null && existing.ownerMemberId !== member.id) {
      return {
        ok: false,
        error: "Você só pode alterar despesas próprias ou da Família.",
      };
    }
  }

  // Mês aberto
  try {
    await assertMonthOpen(familyId, existing.referenceMonth);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "O mês desta despesa está fechado.",
    };
  }

  try {
    await db
      .update(expenses)
      .set({
        status: "pago",
        paidAt: new Date(),
        paidByMemberId: member.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.familyId, familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao marcar despesa como paga:", error);
    return { ok: false, error: "Ocorreu um erro ao atualizar a despesa." };
  }
}

export async function unmarkPaid(idOrInput: string | MarkPaidInput): Promise<ActionResult> {
  const { member, familyId } = await requireMember();

  const raw = typeof idOrInput === "string" ? { id: idOrInput } : idOrInput;
  const parsed = markPaidSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "ID inválido.",
    };
  }

  const { id } = parsed.data;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, id),
        eq(expenses.familyId, familyId),
        isNull(expenses.deletedAt)
      )
    )
    .limit(1);

  if (!existing) {
    return { ok: false, error: "Despesa não encontrada." };
  }

  // Permissão de membro
  if (member.role === "membro") {
    if (existing.ownerMemberId !== null && existing.ownerMemberId !== member.id) {
      return {
        ok: false,
        error: "Você só pode alterar despesas próprias ou da Família.",
      };
    }
  }

  // Mês aberto
  try {
    await assertMonthOpen(familyId, existing.referenceMonth);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "O mês desta despesa está fechado.",
    };
  }

  try {
    await db
      .update(expenses)
      .set({
        status: "pendente",
        paidAt: null,
        paidByMemberId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.familyId, familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao desmarcar pagamento da despesa:", error);
    return { ok: false, error: "Ocorreu um erro ao atualizar a despesa." };
  }
}
