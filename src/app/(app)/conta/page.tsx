import type { Metadata } from "next";
import { requireMember } from "@/lib/session";
import { listFamily } from "@/lib/family-queries";
import { DadosCard } from "./_components/DadosCard";
import { SenhaCard } from "./_components/SenhaCard";
import { AparenciaCard } from "./_components/AparenciaCard";
import { SairCard } from "./_components/SairCard";
import { ZonaPerigoCard } from "./_components/ZonaPerigoCard";

export const metadata: Metadata = {
  title: "Minha conta — Contas da Casa",
};

export default async function ContaPage() {
  const { user, member, familyId, role } = await requireMember();

  let eligibleMembers: Array<{ id: string; displayName: string }> = [];
  if (role === "dono") {
    const { members } = await listFamily(familyId);
    eligibleMembers = members
      .filter((m) => m.id !== member.id && m.status === "ativo" && m.userId !== null)
      .map((m) => ({ id: m.id, displayName: m.displayName }));
  }

  return (
    <main className="cc-main">
      <div className="cc-wrap" style={{ maxWidth: 640 }}>
        <h1 className="heading">Minha conta</h1>
        <DadosCard name={member.displayName || user.name || ""} email={user.email || ""} />
        <SenhaCard />
        <AparenciaCard />
        <SairCard />
        {role === "dono" && <ZonaPerigoCard eligibleMembers={eligibleMembers} />}
      </div>
    </main>
  );
}
