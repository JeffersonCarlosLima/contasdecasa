"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, familyMembers, paymentMethods } from "@/db/schema";
import { InsufficientRoleError, requireRole } from "@/lib/session";
import {
  archiveCategorySchema,
  saveCategorySchema,
  savePaymentMethodSchema,
  setPaymentMethodArchivedSchema,
  type ArchiveCategoryInput,
  type SaveCategoryInput,
  type SavePaymentMethodInput,
  type SetPaymentMethodArchivedInput,
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
  let memberData: Awaited<ReturnType<typeof requireRole>>;
  try {
    memberData = await requireRole("admin");
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return {
        ok: false,
        error: "Apenas administradores podem gerenciar formas de pagamento.",
      };
    }
    throw error;
  }

  const parsed = savePaymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para forma de pagamento.",
    };
  }

  // Verificar duplicidade de nome na mesma família (case-insensitive entre não arquivadas)
  const [duplicate] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.familyId, memberData.familyId),
        eq(paymentMethods.archived, false),
        sql`lower(${paymentMethods.name}) = lower(${parsed.data.name})`,
        parsed.data.id ? ne(paymentMethods.id, parsed.data.id) : undefined
      )
    )
    .limit(1);

  if (duplicate) {
    return {
      ok: false,
      error: "Já existe uma forma de pagamento ativa com este nome na sua família.",
    };
  }

  // Validar se o membro proprietário pertence à mesma família e está ativo
  if (parsed.data.ownerMemberId) {
    const [owner] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.id, parsed.data.ownerMemberId),
          eq(familyMembers.familyId, memberData.familyId),
          eq(familyMembers.status, "ativo")
        )
      )
      .limit(1);

    if (!owner) {
      return {
        ok: false,
        error: "O membro selecionado como proprietário não pertence a esta família ou não está ativo.",
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
          cardLast4: parsed.data.cardLast4 ?? null,
          closingDay: parsed.data.closingDay ?? null,
          dueDay: parsed.data.dueDay ?? null,
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
        archived: false,
        cardLast4: parsed.data.cardLast4 ?? null,
        closingDay: parsed.data.closingDay ?? null,
        dueDay: parsed.data.dueDay ?? null,
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

export async function setPaymentMethodArchived(
  input: SetPaymentMethodArchivedInput | { id: string; archived: boolean }
): Promise<ActionResult> {
  let memberData: Awaited<ReturnType<typeof requireRole>>;
  try {
    memberData = await requireRole("admin");
  } catch (error) {
    if (error instanceof InsufficientRoleError) {
      return {
        ok: false,
        error: "Apenas administradores podem gerenciar formas de pagamento.",
      };
    }
    throw error;
  }

  const parsed = setPaymentMethodArchivedSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para arquivar forma de pagamento.",
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
      error: "Forma de pagamento não encontrada ou você não tem permissão para alterá-la.",
    };
  }

  // Ao reativar (archived: false), verificar se já existe outra forma ativa com o mesmo nome na família
  if (!parsed.data.archived) {
    const [duplicate] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.familyId, memberData.familyId),
          eq(paymentMethods.archived, false),
          sql`lower(${paymentMethods.name}) = lower(${existing.name})`,
          ne(paymentMethods.id, existing.id)
        )
      )
      .limit(1);

    if (duplicate) {
      return {
        ok: false,
        error: "Já existe uma forma de pagamento ativa com este nome na sua família.",
      };
    }
  }

  try {
    await db
      .update(paymentMethods)
      .set({
        archived: parsed.data.archived,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentMethods.id, parsed.data.id),
          eq(paymentMethods.familyId, memberData.familyId)
        )
      );

    return { ok: true };
  } catch (error) {
    console.error("Erro ao arquivar forma de pagamento:", error);
    return { ok: false, error: "Ocorreu um erro ao atualizar a forma de pagamento." };
  }
}
