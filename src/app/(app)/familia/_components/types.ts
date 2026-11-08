import type { familyMembers, familyInvites } from "@/db/schema";
import type { PersonColor } from "@/components/ui/MemberAvatar";

export type FamilyMemberItem = typeof familyMembers.$inferSelect & {
  email?: string | null;
};

export type FamilyInviteItem = typeof familyInvites.$inferSelect;

export const KINSHIP_LABELS: Record<string, string> = {
  titular: "Titular",
  conjuge: "Cônjuge",
  filho: "Filho(a)",
  outro: "Outro parente",
};

export const ROLE_LABELS: Record<string, string> = {
  dono: "Dono",
  admin: "Admin",
  membro: "Membro",
};

export const COLOR_OPTIONS: Array<{ value: PersonColor; label: string; classSuffix: string }> = [
  { value: "person-a", label: "Cor A (terracota)", classSuffix: "a" },
  { value: "person-b", label: "Cor B (âmbar)", classSuffix: "b" },
  { value: "person-c", label: "Cor C (verde oliva)", classSuffix: "c" },
  { value: "person-d", label: "Cor D (ardósia)", classSuffix: "d" },
];
