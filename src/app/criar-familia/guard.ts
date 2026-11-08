import "server-only";
import { redirect } from "next/navigation";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { familyInvites, familyMembers } from "@/db/schema";
import { joinFamilyFromInvite } from "@/lib/family-join";
import { requireSession } from "@/lib/session";

export async function guardCriarFamilia() {
  const session = await requireSession();

  // 1. Já tem família ativa -> redirect('/')
  const [activeMember] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, "ativo")
      )
    )
    .limit(1);

  if (activeMember) {
    redirect("/");
  }

  // 2. Tem convite pendente para o email do usuário -> aceita e vai para '/'
  const userEmail = session.user.email.toLowerCase();
  const [pendingInvite] = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        sql`lower(${familyInvites.email}) = ${userEmail}`,
        isNull(familyInvites.acceptedAt),
        gt(familyInvites.expiresAt, new Date())
      )
    )
    .orderBy(desc(familyInvites.createdAt))
    .limit(1);

  if (pendingInvite) {
    await db.transaction(async (tx) => {
      await joinFamilyFromInvite(tx, session.user, pendingInvite);
    });

    redirect("/");
  }

  return { ok: true as const, user: session.user };
}
