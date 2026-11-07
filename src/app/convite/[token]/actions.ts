"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { familyInvites } from "@/db/schema";
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

  // Exige sessão com o MESMO email do convite
  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      ok: false,
      error: "Este convite foi enviado para outro endereço de email. Faça login com o email correspondente.",
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
