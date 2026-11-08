import "server-only";
import { and, count, desc, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { families, familyInvites, familyMembers } from "@/db/schema";
import { hashInviteToken } from "@/lib/invites";

export async function getShellData(familyId: string): Promise<{
  familyName: string;
  memberCount: number;
}> {
  const [family] = await db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  if (!family) {
    throw new Error("Família não encontrada");
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.status, "ativo")
      )
    );

  return {
    familyName: family.name,
    memberCount: Number(countResult?.count ?? 0),
  };
}

export async function listFamily(familyId: string): Promise<{
  members: Array<typeof familyMembers.$inferSelect>;
  invites: Array<typeof familyInvites.$inferSelect>;
}> {
  const members = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        ne(familyMembers.status, "removido")
      )
    )
    .orderBy(familyMembers.createdAt);

  const invites = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.familyId, familyId),
        isNull(familyInvites.acceptedAt),
        gt(familyInvites.expiresAt, new Date())
      )
    )
    .orderBy(desc(familyInvites.createdAt));

  return {
    members,
    invites,
  };
}

export async function findInviteByToken(token: string): Promise<{
  invite: typeof familyInvites.$inferSelect;
  familyName: string;
  invitedByName: string;
} | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const tokenHash = hashInviteToken(token);

  const [row] = await db
    .select({
      invite: familyInvites,
      familyName: families.name,
      invitedByName: familyMembers.displayName,
    })
    .from(familyInvites)
    .innerJoin(families, eq(familyInvites.familyId, families.id))
    .innerJoin(familyMembers, eq(familyInvites.invitedBy, familyMembers.id))
    .where(
      and(
        eq(familyInvites.tokenHash, tokenHash),
        isNull(familyInvites.acceptedAt),
        gt(familyInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    invite: row.invite,
    familyName: row.familyName,
    invitedByName: row.invitedByName,
  };
}
