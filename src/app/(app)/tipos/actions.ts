"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, expenses, familyMembers, paymentMethods, recurringExpenses } from "@/db/schema";
import { requireRole } from "@/lib/session";
import {
  archiveCategorySchema,
  deletePaymentMethodSchema,
  saveCategorySchema,
  savePaymentMethodSchema,
  type ArchiveCategoryInput,
  type DeletePaymentMethodInput,
  type SaveCategoryInput,
  type SavePaymentMethodInput,
} from "@/lib/validators/cadastros";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function saveCategory(input: SaveCategoryInput): Promise<ActionResult<{ categoryId: string }>> {
  const memberData = await requireRole("admin");

  const parsed = saveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para categoria.",
    };
  }

  // Verificar duplicidade de nome na mesma família
  const [duplicate] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.familyId, memberData.familyId),
        eq(categories.name, parsed.data.name),
        parsed.data.id ? ne(categories.id, parsed.data.id) : undefined
      )
    )
    .limit(1);

  if (duplicate) {
    return {
      ok: false,
      error: "Já existe uma categoria com este nome na sua família.",
    };
  }

  try {
    if (parsed.data.id) {
      // Atualização
      const [existing] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, parsed.data.id),
            eq(categories.familyId, memberData.familyId)
          )
        )
        .limit(1);

      if (!existing) {
        return {
          ok: false,
          error: "Categoria não encontrada ou você não tem permissão para editá-la.",
        };
      }

      await db
        .update(categories)
        .set({
          name: parsed.data.name,
          color: parsed.data.color,
          nature: parsed.data.nature,
          monthlyLimitCents: parsed.data.monthlyLimitCents ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(categories.id, parsed.data.id),
            eq(categories.familyId, memberData.familyId)
          )
        );

      return { ok: true, categoryId: parsed.data.id };
    }

    // Criação
    const [created] = await db
      .insert(categories)
      .values({
        familyId: memberData.familyId,
        name: parsed.data.name,
        color: parsed.data.color,
        nature: parsed.data.nature,
        monthlyLimitCents: parsed.data.monthlyLimitCents ?? null,
      })
      .returning();

    if (!created) {
      return { ok: false, error: "Falha ao salvar a nova categoria." };
    }

    return { ok: true, categoryId: created.id };
  } catch (error) {
    console.error("Erro ao salvar categoria:", error);
    return { ok: false, error: "Ocorreu um erro ao salvar a categoria." };
  }
}

export async function archiveCategory(input: string | ArchiveCategoryInput): Promise<ActionResult> {
  const memberData = await requireRole("admin");

  const rawInput = typeof input === "string" ? { id: input } : input;
  const parsed = archiveCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "ID da categoria inválido.",
    };
  }

  const [existing] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.data.id),
        eq(categories.familyId, memberData.familyId)
      )
    )
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      error: "Categoria não encontrada ou você não tem permissão para arquivá-la.",
    };
  }

  try {
    await db
      .update(categories)
      .set({
        archived: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(categories.id, parsed.data.id),
          eq(categories.familyId, memberData.familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao arquivar categoria:", error);
    return { ok: false, error: "Ocorreu um erro ao arquivar a categoria." };
  }
}

export async function savePaymentMethod(
  input: SavePaymentMethodInput
): Promise<ActionResult<{ paymentMethodId: string }>> {
  const memberData = await requireRole("admin");

  const parsed = savePaymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para forma de pagamento.",
    };
  }

  // Validar se o membro proprietário pertence à mesma família
  if (parsed.data.ownerMemberId) {
    const [owner] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.id, parsed.data.ownerMemberId),
          eq(familyMembers.familyId, memberData.familyId),
          ne(familyMembers.status, "removido")
        )
      )
      .limit(1);

    if (!owner) {
      return {
        ok: false,
        error: "O membro selecionado como proprietário não pertence a esta família.",
      };
    }
  }

  try {
    if (parsed.data.id) {
      // Atualização
      const [existing] = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, parsed.data.id),
            eq(paymentMethods.familyId, memberData.familyId)
          )
        )
        .limit(1);

      if (!existing) {
        return {
          ok: false,
          error: "Forma de pagamento não encontrada ou você não tem permissão para editá-la.",
        };
      }

      await db
        .update(paymentMethods)
        .set({
          name: parsed.data.name,
          type: parsed.data.type,
          ownerMemberId: parsed.data.ownerMemberId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paymentMethods.id, parsed.data.id),
            eq(paymentMethods.familyId, memberData.familyId)
          )
        );

      return { ok: true, paymentMethodId: parsed.data.id };
    }

    // Criação
    const [created] = await db
      .insert(paymentMethods)
      .values({
        familyId: memberData.familyId,
        name: parsed.data.name,
        type: parsed.data.type,
        ownerMemberId: parsed.data.ownerMemberId ?? null,
      })
      .returning();

    if (!created) {
      return { ok: false, error: "Falha ao salvar a nova forma de pagamento." };
    }

    return { ok: true, paymentMethodId: created.id };
  } catch (error) {
    console.error("Erro ao salvar forma de pagamento:", error);
    return { ok: false, error: "Ocorreu um erro ao salvar a forma de pagamento." };
  }
}

export async function deletePaymentMethod(input: string | DeletePaymentMethodInput): Promise<ActionResult> {
  const memberData = await requireRole("admin");

  const rawInput = typeof input === "string" ? { id: input } : input;
  const parsed = deletePaymentMethodSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "ID da forma de pagamento inválido.",
    };
  }

  const [existing] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, parsed.data.id),
        eq(paymentMethods.familyId, memberData.familyId)
      )
    )
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      error: "Forma de pagamento não encontrada ou você não tem permissão para excluí-la.",
    };
  }

  // Bloquear exclusão se houver despesas vinculadas
  const [expenseUsage] = await db
    .select({ count: count() })
    .from(expenses)
    .where(eq(expenses.paymentMethodId, parsed.data.id));

  if (Number(expenseUsage?.count ?? 0) > 0) {
    return {
      ok: false,
      error: "Não é possível excluir: esta forma de pagamento está vinculada a despesas.",
    };
  }

  // Bloquear exclusão se houver despesas recorrentes vinculadas
  const [recurringUsage] = await db
    .select({ count: count() })
    .from(recurringExpenses)
    .where(eq(recurringExpenses.paymentMethodId, parsed.data.id));

  if (Number(recurringUsage?.count ?? 0) > 0) {
    return {
      ok: false,
      error: "Não é possível excluir: esta forma de pagamento está vinculada a despesas recorrentes.",
    };
  }

  try {
    await db
      .delete(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, parsed.data.id),
          eq(paymentMethods.familyId, memberData.familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao excluir forma de pagamento:", error);
    return { ok: false, error: "Ocorreu um erro ao excluir a forma de pagamento." };
  }
}
