"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, families, familyInvites, familyMembers } from "@/db/schema";
import { createInviteToken } from "@/lib/invites";
import { requireSession } from "@/lib/session";
import { createFamilySchema, type CreateFamilyInput } from "@/lib/validators/criar-familia";

const DEFAULT_CATEGORIES = [
  { name: "Moradia", color: "chart-1", nature: "fixa" },
  { name: "Alimentação", color: "chart-2", nature: "variavel" },
  { name: "Transporte", color: "chart-3", nature: "variavel" },
  { name: "Cartões", color: "chart-4", nature: "variavel" },
  { name: "Contas da casa", color: "chart-5", nature: "fixa" },
  { name: "Saúde e academia", color: "chart-6", nature: "fixa" },
] as const;

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function createFamily(data: CreateFamilyInput): Promise<ActionResult> {
  const session = await requireSession();

  const parsed = createFamilySchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  // Verificar se usuário já possui uma família ativa
  const [existingMember] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, "ativo")
      )
    )
    .limit(1);

  if (existingMember) {
    return {
      ok: false,
      error: "Você já possui uma família ativa.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Criar família
      const [newFamily] = await tx
        .insert(families)
        .values({
          name: parsed.data.name,
          defaultSplitRule: parsed.data.splitRule,
          createdBy: session.user.id,
        })
        .returning();

      if (!newFamily) {
        throw new Error("Falha ao criar a família no banco de dados.");
      }

      // 2. Criar membro dono
      const [owner] = await tx
        .insert(familyMembers)
        .values({
          familyId: newFamily.id,
          userId: session.user.id,
          displayName: session.user.name || "Titular",
          role: "dono",
          kinship: parsed.data.kinship,
          color: "person-a",
          participatesInSplit: true,
          status: "ativo",
        })
        .returning();

      if (!owner) {
        throw new Error("Falha ao criar o membro proprietário.");
      }

      // 3. Criar 6 categorias padrão
      await tx.insert(categories).values(
        DEFAULT_CATEGORIES.map((cat) => ({
          familyId: newFamily.id,
          name: cat.name,
          color: cat.color,
          nature: cat.nature,
        }))
      );

      // 4. Criar convite opcional (papel membro, parentesco conjuge)
      if (parsed.data.inviteEmail) {
        const { tokenHash, expiresAt } = createInviteToken();
        await tx.insert(familyInvites).values({
          familyId: newFamily.id,
          email: parsed.data.inviteEmail,
          role: "membro",
          kinship: "conjuge",
          participatesInSplit: true,
          tokenHash,
          invitedBy: owner.id,
          expiresAt,
        });
      }
    });
  } catch (error) {
    console.error("Erro ao criar família:", error);
    return {
      ok: false,
      error: "Ocorreu um erro ao criar a família. Tente novamente.",
    };
  }

  redirect("/");
}
