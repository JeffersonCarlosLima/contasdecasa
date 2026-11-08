import { requireMember } from "@/lib/session";
import { getShellData, listFamily } from "@/lib/family-queries";
import { db } from "@/db";
import { families } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FamilyPageClient } from "./_components/FamilyPageClient";

export const metadata = {
  title: "Família — Contas da Casa",
};

export default async function FamiliaPage() {
  const { user, member } = await requireMember();

  const [shellData, familyData, [familyRecord]] = await Promise.all([
    getShellData(member.familyId),
    listFamily(member.familyId),
    db
      .select({ defaultSplitRule: families.defaultSplitRule })
      .from(families)
      .where(eq(families.id, member.familyId))
      .limit(1),
  ]);

  // Anexa o email da sessão no membro atual para exibição na linha
  const members = familyData.members.map((m) => ({
    ...m,
    email: m.userId === member.userId ? user.email : null,
  }));

  const isSplitPersonalizada = familyRecord?.defaultSplitRule === "personalizada";

  return (
    <main className="cc-main">
      <FamilyPageClient
        initialFamilyName={shellData.familyName}
        initialMembers={members}
        initialInvites={familyData.invites}
        currentUserRole={member.role}
        currentMemberId={member.id}
        isSplitPersonalizada={isSplitPersonalizada}
      />
    </main>
  );
}
