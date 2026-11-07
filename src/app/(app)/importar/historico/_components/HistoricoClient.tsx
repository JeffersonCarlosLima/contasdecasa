"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/money";
import { formatBatchDate } from "../helpers";
import { UndoConfirmModal } from "./UndoConfirmModal";
import type { ImportBatchItem } from "../types";

interface HistoricoClientProps {
  batches: ImportBatchItem[];
  canManage: boolean;
  onUndoBatch?: (batchId: string) => Promise<{ ok: boolean; error?: string }>;
}

function StatusBadge({ status }: { status: ImportBatchItem["status"] }) {
  if (status === "confirmado") {
    return (
      <span className="cc-badge cc-badge--paid">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Confirmado
      </span>
    );
  }

  if (status === "rascunho") {
    return (
      <span className="cc-badge cc-badge--pending">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Rascunho
      </span>
    );
  }

  return (
    <span
      className="cc-badge"
      style={{
        background: "var(--surface-sunken)",
        color: "var(--ink-muted)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </svg>
      Desfeito
    </span>
  );
}

async function defaultUndoAction(batchId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const mod = await import("@/app/(app)/importar/actions");
    if (typeof mod.undoBatch === "function") {
      return await mod.undoBatch(batchId);
    }
    return { ok: false, error: "Ação de desfazer não disponível no servidor." };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message || "Erro ao desfazer lote." };
  }
}

export function HistoricoClient({
  batches,
  canManage,
  onUndoBatch,
}: HistoricoClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [batchToUndo, setBatchToUndo] = useState<ImportBatchItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const handleConfirmUndo = () => {
    if (!batchToUndo) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = onUndoBatch
          ? await onUndoBatch(batchToUndo.id)
          : await defaultUndoAction(batchToUndo.id);

        if (!res.ok) {
          setFeedback({
            type: "error",
            text: res.error || "Não foi possível desfazer a importação.",
          });
          setBatchToUndo(null);
          return;
        }

        setFeedback({
          type: "success",
          text: `Importação de "${batchToUndo.filename}" desfeita com sucesso.`,
        });
        setBatchToUndo(null);
        router.refresh();
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: (err as Error)?.message || "Erro inesperado ao desfazer.",
        });
        setBatchToUndo(null);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {feedback && (
        <div
          role={feedback.type === "success" ? "status" : "alert"}
          aria-live="polite"
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            background:
              feedback.type === "success" ? "var(--invest-soft)" : "var(--danger-soft)",
            color: feedback.type === "success" ? "var(--invest)" : "var(--danger)",
            fontWeight: 500,
            fontSize: "14px",
          }}
        >
          {feedback.text}
        </div>
      )}

      {batches.length === 0 ? (
        <div
          className="cc-card"
          style={{
            padding: "var(--space-8) var(--space-4)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              background: "var(--surface-sunken)",
              display: "grid",
              placeItems: "center",
              color: "var(--ink-muted)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="title" style={{ fontSize: "18px", margin: 0 }}>
            Nenhum extrato importado ainda
          </h2>
          <p className="body cc-muted" style={{ margin: 0, maxWidth: "420px" }}>
            Importe extratos CSV dos seus bancos para categorizar despesas e receitas automaticamente.
          </p>
          <div style={{ marginTop: "8px" }}>
            <Link
              href="/importar"
              className="cc-btn cc-btn--primary"
              style={{ textDecoration: "none" }}
            >
              Importar primeiro extrato
            </Link>
          </div>
        </div>
      ) : (
        <div className="cc-list" role="region" aria-label="Lotes de extrato importados">
          {batches.map((batch) => {
            const hasTotals = batch.totals !== undefined;
            const expensesCents = batch.totals?.expensesCents ?? 0;
            const incomesCents = batch.totals?.incomesCents ?? 0;

            return (
              <div
                key={batch.id}
                className="cc-expense"
                style={{
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  padding: "var(--space-4)",
                  gap: "var(--space-4)",
                }}
              >
                <div className="cc-expense__icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>

                <div className="cc-expense__main" style={{ gap: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="cc-expense__title" style={{ fontSize: "16px" }}>
                      {batch.filename}
                    </span>
                    <StatusBadge status={batch.status} />
                  </div>

                  <span className="cc-expense__meta">
                    <span>{formatBatchDate(batch.createdAt)}</span>
                    <span>· {batch.paymentMethodName}</span>
                    <span>· {batch.ownerName ? batch.ownerName : "Família toda"}</span>
                    <span>· {batch.rowCount} linhas</span>
                    {hasTotals && (
                      <>
                        {expensesCents > 0 && (
                          <span style={{ color: "var(--danger)" }}>
                            · −{formatBRL(expensesCents)}
                          </span>
                        )}
                        {incomesCents > 0 && (
                          <span style={{ color: "var(--invest)" }}>
                            · +{formatBRL(incomesCents)}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>

                <div
                  className="cc-expense__side"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {batch.status === "rascunho" && (
                    <Link
                      href={`/importar/${batch.id}`}
                      className="cc-btn cc-btn--secondary cc-btn--sm"
                      style={{ textDecoration: "none", minHeight: "40px" }}
                    >
                      Continuar revisão
                    </Link>
                  )}

                  {batch.status === "confirmado" && canManage && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      style={{ minHeight: "40px" }}
                      onClick={() => setBatchToUndo(batch)}
                      disabled={isPending}
                    >
                      Desfazer
                    </Button>
                  )}

                  {batch.status === "desfeito" && (
                    <span className="caption cc-muted">
                      Desfeito {batch.undoneAt ? formatBatchDate(batch.undoneAt) : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {batchToUndo && (
        <UndoConfirmModal
          isOpen={!!batchToUndo}
          filename={batchToUndo.filename}
          isPending={isPending}
          onConfirm={handleConfirmUndo}
          onCancel={() => setBatchToUndo(null)}
        />
      )}
    </div>
  );
}
