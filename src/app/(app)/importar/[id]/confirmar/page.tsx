import Link from "next/link";
import { getBatchReview } from "@/lib/import-queries";
import { requireMember } from "@/lib/session";
import { ConfirmBatchView } from "./_components/ConfirmBatchView";

interface ConfirmPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { id } = await params;
  const { familyId } = await requireMember();

  const reviewData = await getBatchReview(familyId, id);

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

  if (batch.status === "confirmado") {
    return (
      <main className="cc-main">
        <div className="cc-wrap">
          <div className="cc-card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <h1 className="title" style={{ marginBottom: "var(--space-2)" }}>
              Este lote já foi confirmado
            </h1>
            <p className="body cc-muted" style={{ marginBottom: "var(--space-4)" }}>
              Os lançamentos deste lote já foram importados com sucesso.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
              <Link href="/importar/historico" className="cc-btn cc-btn--primary" style={{ textDecoration: "none" }}>
                Ver no histórico
              </Link>
              <Link href="/despesas" className="cc-btn cc-btn--secondary" style={{ textDecoration: "none" }}>
                Ver despesas
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (batch.status === "desfeito") {
    return (
      <main className="cc-main">
        <div className="cc-wrap">
          <div className="cc-card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <h1 className="title" style={{ marginBottom: "var(--space-2)" }}>
              Este lote foi desfeito
            </h1>
            <p className="body cc-muted" style={{ marginBottom: "var(--space-4)" }}>
              Lotes desfeitos não podem ser confirmados novamente. Você pode reenviar o extrato caso deseje.
            </p>
            <Link href="/importar" className="cc-btn cc-btn--primary" style={{ textDecoration: "none" }}>
              Nova importação
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        <ConfirmBatchView data={reviewData} />
      </div>
    </main>
  );
}
