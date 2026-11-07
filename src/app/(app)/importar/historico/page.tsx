import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/session";
import { HistoricoClient } from "./_components/HistoricoClient";
import type { ImportBatchItem } from "./types";

export const metadata: Metadata = {
  title: "Histórico de importações — Contas da Casa",
};

export default async function HistoricoImportacoesPage() {
  const { familyId, role } = await requireMember();
  const canManage = role === "admin" || role === "dono";

  let batches: ImportBatchItem[] = [];

  try {
    const importQueries = await import("@/lib/import-queries");
    if (typeof importQueries.listBatches === "function") {
      const rows = await importQueries.listBatches(familyId);
      batches = rows as unknown as ImportBatchItem[];
    }
  } catch {
    // Queries de importação em inicialização
  }

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        <div className="cc-top">
          <div className="cc-top__titles">
            <h1 className="heading cc-hide-sm">Histórico de importações</h1>
            <span className="body cc-muted">
              Lotes de extrato importados, com status e opção de desfazer lançamentos.
            </span>
          </div>

          <div className="cc-actions">
            <Link
              href="/importar"
              className="cc-btn cc-btn--primary"
              style={{ textDecoration: "none" }}
            >
              Novo extrato
            </Link>
          </div>
        </div>

        <HistoricoClient batches={batches} canManage={canManage} />
      </div>
    </main>
  );
}
