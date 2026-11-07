import Link from "next/link";
import { getBatchReview } from "@/lib/import-queries";
import { listCategories } from "@/lib/catalog-queries";
import { listFamily } from "@/lib/family-queries";
import { requireMember } from "@/lib/session";
import { BatchReviewView } from "./_components/BatchReviewView";

interface ImportReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ImportReviewPage({ params }: ImportReviewPageProps) {
  const { id } = await params;
  const { familyId } = await requireMember();

  const [reviewData, categories, familyData] = await Promise.all([
    getBatchReview(familyId, id),
    listCategories(familyId),
    listFamily(familyId),
  ]);

  if (!reviewData) {
    return (
      <main className="cc-main">
        <div className="cc-wrap">
          <div className="cc-card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <h1 className="title" style={{ marginBottom: "var(--space-2)" }}>
              Lote de importação não encontrado
            </h1>
            <p className="body cc-muted" style={{ marginBottom: "var(--space-4)" }}>
              O lote solicitado não existe ou não pertence a esta família.
            </p>
            <Link href="/importar" className="cc-btn cc-btn--primary" style={{ textDecoration: "none" }}>
              Voltar para importação
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { batch } = reviewData;

  if (batch.status === "confirmado" || batch.status === "desfeito") {
    return (
      <main className="cc-main">
        <div className="cc-wrap">
          <div className="cc-card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <h1 className="title" style={{ marginBottom: "var(--space-2)" }}>
              Este lote já foi {batch.status === "confirmado" ? "confirmado" : "desfeito"}
            </h1>
            <p className="body cc-muted" style={{ marginBottom: "var(--space-4)" }}>
              Lotes {batch.status === "confirmado" ? "confirmados" : "desfeitos"} não podem mais ser
              revisados. Você pode consultar os detalhes no histórico de importações.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
              <Link href="/importar/historico" className="cc-btn cc-btn--primary" style={{ textDecoration: "none" }}>
                Ver histórico
              </Link>
              <Link href="/importar" className="cc-btn cc-btn--secondary" style={{ textDecoration: "none" }}>
                Nova importação
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const activeMembers = familyData.members
    .filter((m) => m.status !== "removido")
    .map((m) => ({
      id: m.id,
      displayName: m.displayName,
      color: m.color,
    }));

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        <BatchReviewView
          data={reviewData}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
          members={activeMembers}
        />
      </div>
    </main>
  );
}
