import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { familyInvites, familyMembers } from "@/db/schema";

export const PERSON_COLORS = ["person-a", "person-b", "person-c", "person-d"] as const;
export type PersonColor = (typeof PERSON_COLORS)[number];

export function pickNextMemberColor(existingColors: string[]): PersonColor {
  const used = new Set(existingColors);
  for (const color of PERSON_COLORS) {
    if (!used.has(color)) {
      return color;
    }
  }
  return "person-a";
}

interface UserLike {
  id: string;
  name?: string | null;
  email: string;
}

interface InviteLike {
  id: string;
  familyId: string;
  role: "membro" | "admin" | "dono";
  kinship: "titular" | "conjuge" | "filho" | "outro";
  participatesInSplit: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function joinFamilyFromInvite(tx: any, user: UserLike, invite: InviteLike) {
  // 1. Descobrir cores já em uso por membros não removidos da família
  const existingMembers = await tx
    .select({ color: familyMembers.color })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, invite.familyId),
        ne(familyMembers.status, "removido")
      )
    );

  const usedColors = existingMembers.map((m: { color: string }) => m.color);
  const color = pickNextMemberColor(usedColors);

  // 2. Verificar se já existe registro de membro para este usuário nesta família
  const [existingMember] = await tx
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, invite.familyId),
        eq(familyMembers.userId, user.id)
      )
    )
    .limit(1);

  if (existingMember) {
    await tx
      .update(familyMembers)
      .set({
        status: "ativo",
        role: invite.role,
        kinship: invite.kinship,
        participatesInSplit: invite.participatesInSplit,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, existingMember.id));
  } else {
    await tx.insert(familyMembers).values({
      familyId: invite.familyId,
      userId: user.id,
      displayName: user.name || user.email.split("@")[0] || "Membro",
      role: invite.role,
      kinship: invite.kinship,
      color,
      participatesInSplit: invite.participatesInSplit,
      status: "ativo",
    });
  }

  // 3. Marcar convite como aceito
  await tx
    .update(familyInvites)
    .set({
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(familyInvites.id, invite.id));
}
