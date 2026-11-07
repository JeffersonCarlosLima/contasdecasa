export function getInviteHeading(familyName: string): string {
  return `Você foi convidado para a ${familyName}`;
}

export function getInviteSupportText(invitedByName: string, email: string): string {
  return `${invitedByName} convidou ${email}.`;
}

export const EXPIRED_INVITE_MESSAGE =
  "Este convite expirou ou já foi usado. Peça um novo link para quem convidou você.";

export function isEmailMatch(
  sessionEmail: string | null | undefined,
  inviteEmail: string,
): boolean {
  if (!sessionEmail) return false;
  return sessionEmail.trim().toLowerCase() === inviteEmail.trim().toLowerCase();
}

export function getCadastroLink(email: string): string {
  return `/cadastro?email=${encodeURIComponent(email)}`;
}

export function getEntrarLink(email: string): string {
  return `/entrar?email=${encodeURIComponent(email)}`;
}
