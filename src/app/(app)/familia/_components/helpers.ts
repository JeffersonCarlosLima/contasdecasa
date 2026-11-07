import { TIMEZONE } from "@/lib/dates";
import { KINSHIP_LABELS, ROLE_LABELS } from "./types";
import type { MemberRole } from "@/lib/session";

export function getMemberRoleLabel(role: MemberRole, isDependent: boolean): {
  label: string;
  badgeClass?: string;
} {
  if (role === "dono") {
    return { label: "Dono", badgeClass: "cc-role cc-role--owner" };
  }
  if (isDependent) {
    return { label: "Dependente", badgeClass: "cc-role" };
  }
  if (role === "admin") {
    return { label: "Admin", badgeClass: "cc-role" };
  }
  return { label: "Membro", badgeClass: "cc-role" };
}

export function formatMemberMeta({
  isDependent,
  kinship,
  email,
  participatesInSplit,
}: {
  isDependent: boolean;
  kinship: string;
  email?: string | null;
  participatesInSplit: boolean;
}): string {
  const splitText = participatesInSplit ? "participa da divisão" : "fora da divisão";

  if (isDependent) {
    return `Sem login · despesas lançadas pelos pais · ${splitText}`;
  }

  const kinshipLabel = KINSHIP_LABELS[kinship] ?? "Outro parente";
  const parts = [kinshipLabel];
  if (email) {
    parts.push(email);
  }
  parts.push(splitText);
  return parts.join(" · ");
}

export function formatInviteMeta({
  kinship,
  role,
  expiresAt,
}: {
  kinship: string;
  role: string;
  expiresAt: Date | string;
}): string {
  const kinshipLabel = KINSHIP_LABELS[kinship] ?? "Outro parente";
  const roleName = ROLE_LABELS[role]?.toLowerCase() ?? role.toLowerCase();

  const dateObj = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const expiresFormatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(dateObj);

  return `${kinshipLabel} · ${roleName} · expira em ${expiresFormatted}`;
}

export function getPluralizedSupportText(
  memberCount: number,
  pendingInviteCount: number,
): string {
  const memberText = `${memberCount} ${memberCount === 1 ? "membro" : "membros"}`;
  const inviteText = `${pendingInviteCount} ${
    pendingInviteCount === 1 ? "convite pendente" : "convites pendentes"
  }`;

  return `${memberText} e ${inviteText}. Todos veem os lançamentos de todos; cada um lança as próprias despesas.`;
}

export function buildWhatsAppInviteUrl(familyName: string, link: string): string {
  const message = `Você foi convidado para a ${familyName} no Contas da Casa. Crie sua conta com este email e entre na família: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
