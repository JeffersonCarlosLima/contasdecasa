"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { familyInvites, familyMembers } from "@/db/schema";
import { joinFamilyFromInvite } from "@/lib/family-join";
import { hashInviteToken } from "@/lib/invites";
import { requireSession } from "@/lib/session";
import { acceptInviteSchema } from "@/lib/validators/criar-familia";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function acceptInvite(token: string): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({ token });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Token do convite inválido.",
    };
  }

  const session = await requireSession();
  const tokenHash = hashInviteToken(parsed.data.token);

  // Buscar convite válido
  const [invite] = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.tokenHash, tokenHash),
        isNull(familyInvites.acceptedAt),
        gt(familyInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    return {
      ok: false,
      error: "Este convite expirou ou já foi usado. Peça um novo link para quem convidou você.",
    };
  }

  // Usuário que já é membro ativo de OUTRA família não pode aceitar
  const [existingMembership] = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, "ativo")
      )
    )
    .limit(1);

  if (existingMembership && existingMembership.familyId !== invite.familyId) {
    return {
      ok: false,
      error: "Você já participa de outra família.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await joinFamilyFromInvite(tx, session.user, invite);
    });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return {
      ok: false,
      error: "Ocorreu um erro ao aceitar o convite. Tente novamente.",
    };
  }

  redirect("/");
}
