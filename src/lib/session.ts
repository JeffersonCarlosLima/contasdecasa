import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { auth } from "@/lib/auth";

export type MemberRole = "membro" | "admin" | "dono";

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  membro: 1,
  admin: 2,
  dono: 3,
};

export class InsufficientRoleError extends Error {
  constructor(currentRole: string, minRole: MemberRole) {
    super(`Acesso negado: papel "${currentRole}" insuficiente para o mínimo "${minRole}".`);
    this.name = "InsufficientRoleError";
  }
}

export function hasRequiredRole(userRole: MemberRole, minRole: MemberRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return userLevel >= minLevel;
}

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/entrar");
  }

  return session;
}

export async function requireMember() {
  const session = await requireSession();

  const [member] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, "ativo")
      )
    )
    .limit(1);

  if (!member) {
    redirect("/criar-familia");
  }

  return {
    user: session.user,
    member,
    familyId: member.familyId,
    role: member.role,
  };
}

/**
 * Versão deduplicada por requisição, para uso em layouts e páginas (Server Components):
 * o layout e a página chamam `requireMember` na mesma renderização e só uma consulta roda.
 * Server Actions devem continuar usando `requireMember`/`requireRole` (sem cache), porque
 * uma ação pode alterar o próprio membro e a re-renderização precisa ver o dado novo.
 */
export const requireMemberCached = cache(requireMember);

export async function requireRole(min: MemberRole) {
  const memberData = await requireMember();

  if (!hasRequiredRole(memberData.role, min)) {
    throw new InsufficientRoleError(memberData.role, min);
  }

  return memberData;
}
