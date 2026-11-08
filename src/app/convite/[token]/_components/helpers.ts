export function getInviteHeading(familyName: string): string {
  return `Você foi convidado para a ${familyName}`;
}

export function getInviteSupportText(invitedByName: string, email?: string | null): string {
  if (email) {
    return `${invitedByName} convidou ${email}.`;
  }
  return `${invitedByName} convidou você.`;
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

export function getCadastroLink(token: string): string {
  return `/cadastro?convite=${encodeURIComponent(token)}`;
}

export function getEntrarLink(token: string): string {
  return `/entrar?convite=${encodeURIComponent(token)}`;
}
