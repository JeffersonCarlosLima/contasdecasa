"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { confirmBatch } from "@/app/(app)/importar/actions";
import { computeReviewTotals } from "../../_components/helpers";
import type { BatchReviewData } from "../../_components/types";

export interface ConfirmBatchViewProps {
  data: BatchReviewData;
}

export function ConfirmBatchView({ data }: ConfirmBatchViewProps) {
  const router = useRouter();
  const { batch, rows } = data;

  const [serverError, setServerError] = useState<string | null>(null);
  const [isConfirming, startTransition] = useTransition();

  // Calcular totais reais baseados nas linhas que estão selecionadas
  const selectedIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.selected) s.add(r.id);
    }
    return s;
  }, [rows]);

  const totals = useMemo(() => {
    return computeReviewTotals(rows, selectedIds);
  }, [rows, selectedIds]);

  const unselectedCount = totals.totalRows - totals.selectedCount;

  function handleConfirm() {
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await confirmBatch(batch.id);
        if (!res.ok) {
          setServerError(res.error);
          return;
        }

        const targetMonth = res.targetMonth;

        if (targetMonth) {
          router.push(`/despesas?mes=${targetMonth}&lote=${batch.id}`);
        } else {
          router.push(`/despesas?lote=${batch.id}`);
        }
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro inesperado ao confirmar a importação."
        );
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 720, margin: "0 auto" }}>
      <div className="cc-top">
        <div className="cc-top__titles">
          <Link
            href={`/importar/${batch.id}`}
            className="label cc-touch-link"
            style={{ textDecoration: "none" }}
          >
            ← Voltar para revisão
          </Link>
          <h1 className="heading">Confirmar importação</h1>
          <span className="body cc-muted">
            Confira o resumo final. Lançamentos confirmados serão gravados no sistema.
          </span>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--danger-soft)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--danger)",
          }}
        >
          {serverError}
        </div>
      )}

      {totals.hasSelectedExpensesWithoutCategory && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            backgroundColor: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <b>Atenção:</b> Existem {totals.missingCategoryCount} despesa{totals.missingCategoryCount > 1 ? "s" : ""}{" "}
            selecionada{totals.missingCategoryCount > 1 ? "s" : ""} sem categoria. Toda despesa precisa de uma
            categoria antes da confirmação.
          </span>
        </div>
      )}

      {totals.missingOwnerCount > 0 && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            backgroundColor: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <b>Atenção:</b> Existem {totals.missingOwnerCount} receita{totals.missingOwnerCount > 1 ? "s" : ""}{" "}
            selecionada{totals.missingOwnerCount > 1 ? "s" : ""} sem membro responsável atribuído.
          </span>
        </div>
      )}

      <div className="cc-card" style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <h2 className="title" style={{ fontSize: 18, margin: 0 }}>
          Resumo do lote
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="caption cc-muted">Arquivo</span>
            <span style={{ fontWeight: 600 }}>{batch.filename}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="caption cc-muted">Forma de pagamento</span>
            <span style={{ fontWeight: 600 }}>{batch.paymentMethod.name}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="caption cc-muted">Total no arquivo</span>
            <span>{totals.totalRows} linhas</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="caption cc-muted">Desmarcadas / Ignoradas</span>
            <span>{unselectedCount} linhas</span>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="body">Lançamentos a gravar:</span>
            <b style={{ fontSize: 18 }}>{totals.selectedCount}</b>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="body">Total de despesas:</span>
            <b className="cc-num" style={{ fontSize: 18, color: "var(--ink)" }}>
              {formatBRL(totals.expensesCents)}
            </b>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="body">Total de receitas:</span>
            <b className="cc-num" style={{ fontSize: 18, color: "var(--brand-ink)" }}>
              {formatBRL(totals.incomesCents)}
            </b>
          </div>
        </div>

        <div className="cc-formfoot" style={{ marginTop: "var(--space-2)" }}>
          <Link
            href={`/importar/${batch.id}`}
            className="cc-btn cc-btn--secondary"
            style={{ textDecoration: "none", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            Voltar para revisão
          </Link>

          <button
            type="button"
            className="cc-btn cc-btn--primary"
            style={{ minHeight: "44px" }}
            onClick={handleConfirm}
            disabled={!totals.canProceedToConfirm || isConfirming}
          >
            {isConfirming ? "Confirmando lançamentos…" : "Confirmar importação"}
          </button>
        </div>
      </div>
    </div>
  );
}
