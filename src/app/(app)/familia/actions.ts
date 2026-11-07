"use server";

import { and, count, eq, gt, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { families, familyInvites, familyMembers, user } from "@/db/schema";
import { createInviteToken, inviteLink } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/mail";
import { type MemberRole, requireRole } from "@/lib/session";
import {
  addDependentSchema,
  cancelInviteSchema,
  type AddDependentInput,
  type CancelInviteInput,
  type InviteMemberInput,
  inviteMemberSchema,
  type RemoveMemberInput,
  removeMemberSchema,
  type RenameFamilyInput,
  renameFamilySchema,
  type ResendInviteInput,
  resendInviteSchema,
  type TransferOwnershipInput,
  transferOwnershipSchema,
  type UpdateMemberInput,
  updateMemberSchema,
} from "@/lib/validators/familia";

/* ==========================================================================
 * Regras de permissão e rate limit (funções puras testáveis)
 * ========================================================================== */

export async function checkInviteRateLimit(
  recentInviteCount: number,
  maxPerHour = 10,
): Promise<{ allowed: boolean; reason?: string }> {
  if (recentInviteCount >= maxPerHour) {
    return {
      allowed: false,
      reason: `Limite de convites atingido (máximo de ${maxPerHour} por hora). Tente novamente mais tarde.`,
    };
  }
  return { allowed: true };
}

export async function canUpdateMemberRole(
  currentUserRole: MemberRole,
  targetMemberRole: MemberRole,
  newRole?: MemberRole,
): Promise<{ allowed: boolean; reason?: string }> {
  if (targetMemberRole === "dono" && newRole && newRole !== "dono") {
    return {
      allowed: false,
      reason: "O papel do dono não pode ser alterado por aqui. Use transferir posse.",
    };
  }
  if (newRole === "dono") {
    return {
      allowed: false,
      reason: "Para promover um membro a dono, utilize a função de transferir posse.",
    };
  }
  if (currentUserRole !== "dono" && targetMemberRole === "admin" && newRole) {
    return {
      allowed: false,
      reason: "Apenas o dono pode alterar o papel de outro administrador.",
    };
  }
  return { allowed: true };
}

export async function canRemoveMemberRule(
  currentUserRole: MemberRole,
  currentMemberId: string,
  targetMember: { id: string; role: MemberRole },
): Promise<{ allowed: boolean; reason?: string }> {
  if (targetMember.role === "dono") {
    return {
      allowed: false,
      reason: "O dono da família não pode ser removido.",
    };
  }
  if (targetMember.id === currentMemberId) {
    return {
      allowed: false,
      reason: "Você não pode remover a si mesmo da família.",
    };
  }
  if (currentUserRole !== "dono" && targetMember.role === "admin") {
    return {
      allowed: false,
      reason: "Apenas o dono pode remover outro administrador.",
    };
  }
  return { allowed: true };
}

export async function canTransferOwnershipRule(
  currentUserRole: MemberRole,
  currentMemberId: string,
  targetMember: { id: string; userId: string | null; status: string },
): Promise<{ allowed: boolean; reason?: string }> {
  if (currentUserRole !== "dono") {
    return {
      allowed: false,
      reason: "Apenas o dono atual pode transferir a posse da família.",
    };
  }
  if (targetMember.id === currentMemberId) {
    return {
      allowed: false,
      reason: "Você já é o dono da família.",
    };
  }
  if (targetMember.userId === null) {
    return {
      allowed: false,
      reason: "Não é possível transferir a posse para um dependente sem login.",
    };
  }
  if (targetMember.status !== "ativo") {
    return {
      allowed: false,
      reason: "Não é possível transferir a posse para um membro inativo ou removido.",
    };
  }
  return { allowed: true };
}

/* ==========================================================================
 * Server Actions
 * ========================================================================== */

export async function renameFamily(
  input: RenameFamilyInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = renameFamilySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Nome inválido." };
    }

    await db
      .update(families)
      .set({
        name: parsed.data.name,
        updatedAt: new Date(),
      })
      .where(eq(families.id, sessionMember.familyId));

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao renomear família." };
  }
}

export async function inviteMember(
  input: InviteMemberInput,
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = inviteMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }
    const data = parsed.data;

    // 1. Rate limit: máx 10 convites por membro por hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recentRow] = await db
      .select({ total: count() })
      .from(familyInvites)
      .where(
        and(
          eq(familyInvites.familyId, sessionMember.familyId),
          eq(familyInvites.invitedBy, sessionMember.member.id),
          gte(familyInvites.createdAt, oneHourAgo),
        ),
      );
    const recentCount = Number(recentRow?.total ?? 0);
    const rateLimitCheck = await checkInviteRateLimit(recentCount, 10);
    if (!rateLimitCheck.allowed) {
      return { ok: false, error: rateLimitCheck.reason! };
    }

    // 2. Verifica se o email já é membro ativo na família
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (existingUser) {
      const [existingMember] = await db
        .select({ id: familyMembers.id })
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, sessionMember.familyId),
            eq(familyMembers.userId, existingUser.id),
            eq(familyMembers.status, "ativo"),
          ),
        )
        .limit(1);

      if (existingMember) {
        return { ok: false, error: "Este email já pertence a um membro ativo desta família." };
      }
    }

    // 3. Verifica se já existe convite pendente e válido para este email nesta família
    const now = new Date();
    const [pendingInvite] = await db
      .select({ id: familyInvites.id })
      .from(familyInvites)
      .where(
        and(
          eq(familyInvites.familyId, sessionMember.familyId),
          eq(familyInvites.email, data.email),
          isNull(familyInvites.acceptedAt),
          gt(familyInvites.expiresAt, now),
        ),
      )
      .limit(1);

    if (pendingInvite) {
      return { ok: false, error: "Já existe um convite pendente para este email nesta família." };
    }

    // 4. Cria o convite com token aleatório e guarda apenas o hash
    const { token, tokenHash, expiresAt } = createInviteToken();
    await db.insert(familyInvites).values({
      familyId: sessionMember.familyId,
      email: data.email,
      role: data.role,
      kinship: data.kinship,
      participatesInSplit: data.participatesInSplit,
      tokenHash,
      invitedBy: sessionMember.member.id,
      expiresAt,
    });

    const link = inviteLink(token);

    // 5. Envia email se SMTP estiver configurado (sem falhar a action caso dê erro de rede)
    const [fam] = await db
      .select({ name: families.name })
      .from(families)
      .where(eq(families.id, sessionMember.familyId))
      .limit(1);

    await sendInviteEmail({
      to: data.email,
      familyName: fam?.name || "Família",
      link,
    }).catch(() => null);

    return { ok: true, link };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao convidar membro." };
  }
}

export async function resendInvite(
  inviteIdOrInput: string | ResendInviteInput,
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = resendInviteSchema.safeParse(
      typeof inviteIdOrInput === "string" ? { inviteId: inviteIdOrInput } : inviteIdOrInput,
    );
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "ID de convite inválido." };
    }

    const [invite] = await db
      .select()
      .from(familyInvites)
      .where(
        and(
          eq(familyInvites.id, parsed.data.inviteId),
          eq(familyInvites.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!invite) {
      return { ok: false, error: "Convite não encontrado." };
    }
    if (invite.acceptedAt) {
      return { ok: false, error: "Este convite já foi aceito." };
    }

    // Gera token novo e nova validade de 7 dias
    const { token, tokenHash, expiresAt } = createInviteToken();
    await db
      .update(familyInvites)
      .set({
        tokenHash,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(familyInvites.id, invite.id));

    const link = inviteLink(token);

    const [fam] = await db
      .select({ name: families.name })
      .from(families)
      .where(eq(families.id, sessionMember.familyId))
      .limit(1);

    await sendInviteEmail({
      to: invite.email,
      familyName: fam?.name || "Família",
      link,
    }).catch(() => null);

    return { ok: true, link };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao reenviar convite." };
  }
}

export async function cancelInvite(
  inviteIdOrInput: string | CancelInviteInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = cancelInviteSchema.safeParse(
      typeof inviteIdOrInput === "string" ? { inviteId: inviteIdOrInput } : inviteIdOrInput,
    );
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "ID de convite inválido." };
    }

    const [deleted] = await db
      .delete(familyInvites)
      .where(
        and(
          eq(familyInvites.id, parsed.data.inviteId),
          eq(familyInvites.familyId, sessionMember.familyId),
        ),
      )
      .returning({ id: familyInvites.id });

    if (!deleted) {
      return { ok: false, error: "Convite não encontrado." };
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao cancelar convite." };
  }
}

export async function addDependent(
  input: AddDependentInput,
): Promise<{ ok: true; memberId: string } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = addDependentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }
    const data = parsed.data;

    const [newMember] = await db
      .insert(familyMembers)
      .values({
        familyId: sessionMember.familyId,
        userId: null,
        displayName: data.displayName,
        role: "membro",
        kinship: data.kinship,
        color: "person-d",
        participatesInSplit: data.participatesInSplit,
        status: "ativo",
      })
      .returning({ id: familyMembers.id });

    if (!newMember) {
      return { ok: false, error: "Falha ao criar dependente." };
    }

    return { ok: true, memberId: newMember.id };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao adicionar dependente." };
  }
}

export async function updateMember(
  memberIdOrInput: string | UpdateMemberInput,
  data?: Omit<UpdateMemberInput, "memberId">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const rawInput =
      typeof memberIdOrInput === "string"
        ? { memberId: memberIdOrInput, ...(data || {}) }
        : memberIdOrInput;

    const parsed = updateMemberSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const { memberId, ...updates } = parsed.data;

    const [target] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.id, memberId),
          eq(familyMembers.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!target) {
      return { ok: false, error: "Membro não encontrado." };
    }

    const roleCheck = await canUpdateMemberRole(
      sessionMember.role,
      target.role,
      updates.role,
    );
    if (!roleCheck.allowed) {
      return { ok: false, error: roleCheck.reason! };
    }

    await db
      .update(familyMembers)
      .set({
        ...(updates.displayName ? { displayName: updates.displayName } : {}),
        ...(updates.role ? { role: updates.role } : {}),
        ...(updates.color ? { color: updates.color } : {}),
        ...(updates.kinship ? { kinship: updates.kinship } : {}),
        ...(updates.participatesInSplit !== undefined
          ? { participatesInSplit: updates.participatesInSplit }
          : {}),
        ...(updates.customPercent !== undefined
          ? { customPercent: updates.customPercent }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, target.id));

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao atualizar membro." };
  }
}

export async function removeMember(
  memberIdOrInput: string | RemoveMemberInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("admin");
    const parsed = removeMemberSchema.safeParse(
      typeof memberIdOrInput === "string" ? { memberId: memberIdOrInput } : memberIdOrInput,
    );
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "ID de membro inválido." };
    }

    const [target] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.id, parsed.data.memberId),
          eq(familyMembers.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!target) {
      return { ok: false, error: "Membro não encontrado." };
    }

    const removeCheck = await canRemoveMemberRule(
      sessionMember.role,
      sessionMember.member.id,
      target,
    );
    if (!removeCheck.allowed) {
      return { ok: false, error: removeCheck.reason! };
    }

    await db
      .update(familyMembers)
      .set({
        status: "removido",
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, target.id));

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao remover membro." };
  }
}

export async function transferOwnership(
  memberIdOrInput: string | TransferOwnershipInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("dono");
    const parsed = transferOwnershipSchema.safeParse(
      typeof memberIdOrInput === "string" ? { memberId: memberIdOrInput } : memberIdOrInput,
    );
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "ID de membro inválido." };
    }

    const [target] = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.id, parsed.data.memberId),
          eq(familyMembers.familyId, sessionMember.familyId),
        ),
      )
      .limit(1);

    if (!target) {
      return { ok: false, error: "Membro não encontrado." };
    }

    const transferCheck = await canTransferOwnershipRule(
      sessionMember.role,
      sessionMember.member.id,
      target,
    );
    if (!transferCheck.allowed) {
      return { ok: false, error: transferCheck.reason! };
    }

    await db.transaction(async (tx) => {
      // Dono anterior passa para admin
      await tx
        .update(familyMembers)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(familyMembers.id, sessionMember.member.id));

      // Novo dono
      await tx
        .update(familyMembers)
        .set({ role: "dono", updatedAt: new Date() })
        .where(eq(familyMembers.id, target.id));

      // Atualiza dono na tabela families
      await tx
        .update(families)
        .set({ createdBy: target.userId!, updatedAt: new Date() })
        .where(eq(families.id, sessionMember.familyId));
    });

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao transferir posse." };
  }
}

export async function deleteFamily(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sessionMember = await requireRole("dono");

    await db.delete(families).where(eq(families.id, sessionMember.familyId));

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao excluir família." };
  }
}
