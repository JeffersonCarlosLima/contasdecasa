import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/session";
import { listPaymentMethods } from "@/lib/catalog-queries";
import { listFamily } from "@/lib/family-queries";
import { UploadForm } from "./_upload/UploadForm";

export const metadata: Metadata = {
  title: "Importar extrato — Contas da Casa",
};

export default async function ImportarPage() {
  const { member, familyId, role } = await requireMember();

  const [allPaymentMethods, familyData] = await Promise.all([
    listPaymentMethods(familyId),
    listFamily(familyId),
  ]);

  const canEdit = role === "admin" || role === "dono";

  // Apenas ativas do tipo cartão ou conta, ordenadas com as do membro logado primeiro, depois alfabética
  const paymentMethods = allPaymentMethods
    .filter((pm) => !pm.archived && (pm.type === "cartao" || pm.type === "conta"))
    .sort((a, b) => {
      const aIsSelf = a.ownerMemberId === member.id ? 0 : 1;
      const bIsSelf = b.ownerMemberId === member.id ? 0 : 1;
      if (aIsSelf !== bIsSelf) return aIsSelf - bIsSelf;
      return a.name.localeCompare(b.name, "pt-BR");
    });

  return (
    <main className="cc-main">
      <div className="cc-wrap" style={{ maxWidth: 720 }}>
        <div className="cc-top">
          <div className="cc-top__titles">
            <h1 className="heading">Importar extrato</h1>
            <span className="body cc-muted">
              Envie extratos em CSV para transformar lançamentos bancários em despesas e receitas da casa.
            </span>
          </div>

          <div className="cc-actions">
            <Link
              href="/importar/historico"
              className="cc-btn cc-btn--secondary"
              style={{ textDecoration: "none" }}
            >
              Histórico de importações
            </Link>
          </div>
        </div>

        <UploadForm
          canEdit={canEdit}
          currentMember={{
            id: member.id,
            displayName: member.displayName,
            role,
          }}
          paymentMethods={paymentMethods.map((pm) => ({
            id: pm.id,
            name: pm.name,
          }))}
          members={familyData.members
            .filter((m) => m.status === "ativo")
            .map((m) => ({
              id: m.id,
              displayName: m.displayName,
              color: m.color,
              role: m.role,
            }))}
        />
      </div>
    </main>
  );
}
