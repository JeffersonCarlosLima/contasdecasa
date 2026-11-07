import type { ReactNode } from "react";
import { requireMember } from "@/lib/session";
import { getShellData } from "@/lib/family-queries";
import { AppShell } from "@/components/app";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, member, familyId } = await requireMember();
  const { familyName, memberCount } = await getShellData(familyId);

  return (
    <AppShell
      userName={member.displayName || user.name || "Usuário"}
      userColor={member.color ?? "person-a"}
      familyName={familyName}
      memberCount={memberCount}
    >
      {children}
    </AppShell>
  );
}
