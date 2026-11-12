"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatBRL } from "@/lib/money";
import {
  clearTransferSuggestion,
  createRuleFromRow,
  setRowLink,
  updateRows,
} from "@/app/(app)/importar/actions";
import { BulkActionsBar } from "./BulkActionsBar";
import {
  computeReviewTotals,
  filterReviewRows,
  getDisabledProceedReason,
  isRowAutoSelected,
  isRowSelectable,
  sanitizeErrorMessage,
} from "./helpers";
import { ReviewMobileCards } from "./ReviewMobileCards";
import { ReviewTable } from "./ReviewTable";
import { RuleModal } from "./RuleModal";
import type {
  BatchReviewData,
  CategoryOption,
  FilterStatus,
  ImportRowReviewItem,
  MemberOption,
} from "./types";

export interface BatchReviewViewProps {
  data: BatchReviewData;
  categories: CategoryOption[];
  members: MemberOption[];
}

export function BatchReviewView({
  data,
  categories,
  members,
}: BatchReviewViewProps) {
  const { batch } = data;

  // Padrão do sistema: Novas marcadas, Duplicadas e Ignoradas desmarcadas
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const r of data.rows) {
      if (isRowAutoSelected(r)) {
        initial.add(r.id);
      }
    }
    return initial;
  });

  const [rows, setRows] = useState<ImportRowReviewItem[]>(() => {
    return data.rows.map((r) => ({
      ...r,
      selected: isRowAutoSelected(r),
    }));
  });

  const [filter, setFilter] = useState<FilterStatus>("todas");
  const [ruleModalRow, setRuleModalRow] = useState<ImportRowReviewItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtragem
  const visibleRows = useMemo(() => {
    return filterReviewRows(rows, filter);
  }, [rows, filter]);

  // Linhas selecionáveis entre as visíveis (ignora linhas com tipo 'ignorar' e duplicadas no 'selecionar todas')
  const selectableVisibleRows = useMemo(() => {
    return visibleRows.filter((r) => isRowSelectable(r) && r.situation !== "duplicada");
  }, [visibleRows]);

  const visibleSelectedCount = useMemo(() => {
    return selectableVisibleRows.filter((r) => selectedIds.has(r.id)).length;
  }, [selectableVisibleRows, selectedIds]);

  const allVisibleSelected =
    selectableVisibleRows.length > 0 &&
    visibleSelectedCount === selectableVisibleRows.length;

  // Totais e validação
  const totals = useMemo(() => {
    return computeReviewTotals(rows, selectedIds);
  }, [rows, selectedIds]);

  const disabledProceedReason = useMemo(() => {
    return getDisabledProceedReason(totals);
  }, [totals]);

  // Contadores por filtro
  const counts = useMemo(() => {
    let novas = 0;
    let duplicadas = 0;
    let ignoradas = 0;

    for (const r of rows) {
      if (r.situation === "nova") novas++;
      if (r.situation === "duplicada") duplicadas++;
      if (r.type === "ignorar") ignoradas++;
    }

    return { todas: rows.length, novas, duplicadas, ignoradas };
  }, [rows]);

  /* ==========================================================================
   * Handlers de Ações
   * ========================================================================== */

  function handleToggleSelectRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row || !isRowSelectable(row)) return;

    const next = new Set(selectedIds);
    const willSelect = !next.has(id);
    if (willSelect) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: willSelect } : r))
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: [id],
          patch: { selected: willSelect },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao atualizar seleção."
          )
        );
      }
    });
  }

  function handleToggleSelectAllVisible() {
    const next = new Set(selectedIds);
    const shouldSelectAll = !allVisibleSelected;

    const rowIdsToUpdate: string[] = [];

    for (const r of selectableVisibleRows) {
      if (shouldSelectAll) {
        next.add(r.id);
      } else {
        next.delete(r.id);
      }
      rowIdsToUpdate.push(r.id);
    }
    setSelectedIds(next);

    setRows((prev) =>
      prev.map((r) =>
        next.has(r.id) ? { ...r, selected: true } : { ...r, selected: false }
      )
    );

    if (rowIdsToUpdate.length === 0) return;

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: rowIdsToUpdate,
          patch: { selected: shouldSelectAll },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao atualizar seleção em lote."
          )
        );
      }
    });
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
    const allIds = rows.map((r) => r.id);

    setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: allIds,
          patch: { selected: false },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao limpar seleção."
          )
        );
      }
    });
  }

  function handleUpdateRowDescription(rowId: string, description: string | null) {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, descriptionEdited: description } : r))
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: [rowId],
          patch: { description },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao atualizar descrição."
          )
        );
      }
    });
  }

  function handleUpdateRowType(
    rowId: string,
    type: "despesa" | "receita" | "salario" | "ignorar"
  ) {
    const targetRow = rows.find((r) => r.id === rowId);
    const wasIgnored = targetRow?.type === "ignorar";
    const willBeIgnored = type === "ignorar";

    const next = new Set(selectedIds);
    let newSelected = targetRow?.selected ?? false;

    if (willBeIgnored) {
      next.delete(rowId);
      newSelected = false;
    } else if (wasIgnored && targetRow?.situation === "nova") {
      next.add(rowId);
      newSelected = true;
    }

    setSelectedIds(next);
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, type, selected: newSelected } : r))
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: [rowId],
          patch: { type, selected: newSelected },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao alterar tipo."
          )
        );
      }
    });
  }

  function handleUpdateRowCategory(rowId: string, categoryId: string | null) {
    const catObj = categories.find((c) => c.id === categoryId) || null;

    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              categoryId,
              category: catObj ? { id: catObj.id, name: catObj.name, color: catObj.color } : null,
            }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: [rowId],
          patch: { categoryId },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao alterar categoria."
          )
        );
      }
    });
  }

  function handleUpdateRowOwner(rowId: string, ownerId: string | null) {
    const memberObj = members.find((m) => m.id === ownerId) || null;

    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              ownerMemberId: ownerId,
              ownerMember: memberObj
                ? { id: memberObj.id, displayName: memberObj.displayName, color: memberObj.color }
                : null,
            }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: [rowId],
          patch: { ownerId },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao alterar responsável."
          )
        );
      }
    });
  }

  function handleBulkType(type: "despesa" | "receita" | "salario" | "ignorar") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const next = new Set(selectedIds);
    const willBeIgnored = type === "ignorar";

    if (willBeIgnored) {
      for (const id of ids) {
        next.delete(id);
      }
    }

    setSelectedIds(next);
    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id)
          ? { ...r, type, selected: willBeIgnored ? false : r.selected }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: ids,
          patch: willBeIgnored ? { type, selected: false } : { type },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao aplicar tipo em lote."
          )
        );
      }
    });
  }

  function handleBulkCategory(categoryId: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const catObj = categories.find((c) => c.id === categoryId) || null;

    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id)
          ? {
              ...r,
              categoryId,
              category: catObj ? { id: catObj.id, name: catObj.name, color: catObj.color } : null,
            }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: ids,
          patch: { categoryId },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao aplicar categoria em lote."
          )
        );
      }
    });
  }

  function handleBulkOwner(ownerId: string | null) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const memberObj = members.find((m) => m.id === ownerId) || null;

    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id)
          ? {
              ...r,
              ownerMemberId: ownerId,
              ownerMember: memberObj
                ? { id: memberObj.id, displayName: memberObj.displayName, color: memberObj.color }
                : null,
            }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await updateRows({
          batchId: batch.id,
          rowIds: ids,
          patch: { ownerId },
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao aplicar responsável em lote."
          )
        );
      }
    });
  }

  function handleLinkExpense(rowId: string, expenseId: string | null) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, linkedExpenseId: expenseId } : r
      )
    );

    startTransition(async () => {
      try {
        const res = await setRowLink({
          batchId: batch.id,
          rowId,
          expenseId,
        });
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao vincular despesa."
          )
        );
      }
    });
  }

  function handleClearTransfer(rowId: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, linkedRowId: null } : r))
    );

    startTransition(async () => {
      try {
        const res = await clearTransferSuggestion(batch.id, rowId);
        if (!res.ok) setServerError(sanitizeErrorMessage(res.error));
      } catch (err) {
        setServerError(
          sanitizeErrorMessage(
            err instanceof Error ? err.message : "Erro ao desfazer transferência."
          )
        );
      }
    });
  }

  async function handleSaveRule(params: {
    batchId: string;
    rowId: string;
    matchType: "contem" | "comeca";
    pattern: string;
    displayName?: string | null;
    categoryId: string;
    ownerId?: string | null;
  }) {
    const res = await createRuleFromRow({
      batchId: params.batchId,
      rowId: params.rowId,
      matchType: params.matchType,
      pattern: params.pattern,
      displayName: params.displayName,
      categoryId: params.categoryId,
      ownerId: params.ownerId,
      paymentMethodId: batch.paymentMethod.id,
    });

    if (!res.ok) {
      throw new Error(res.error);
    }

    setSuccessMessage(`Regra criada para "${params.pattern}".`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Top Header & Navigation */}
      <div className="cc-top">
        <div className="cc-top__titles">
          <Link
            href="/importar"
            className="label cc-touch-link"
            style={{ textDecoration: "none" }}
          >
            ← Voltar para envio
          </Link>
          <h1 className="heading">Revisar extrato</h1>
          <span className="body cc-muted">
            {batch.filename} · {batch.paymentMethod.name} · {batch.rowCount} linhas no extrato
          </span>
        </div>

        <div className="cc-actions cc-hide-sm">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {totals.canProceedToConfirm ? (
              <Link
                href={`/importar/${batch.id}/confirmar`}
                className="cc-btn cc-btn--primary"
                style={{ textDecoration: "none" }}
              >
                Continuar para confirmação ({totals.selectedCount})
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  disabled
                  aria-describedby={
                    disabledProceedReason ? "disabled-proceed-reason" : undefined
                  }
                >
                  Continuar para confirmação ({totals.selectedCount})
                </button>
                {disabledProceedReason && (
                  <span
                    id="disabled-proceed-reason"
                    role="status"
                    className="caption cc-muted"
                    style={{
                      lineHeight: "1.4",
                      maxWidth: 360,
                    }}
                  >
                    {disabledProceedReason}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {serverError && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {serverError}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            color: "var(--brand-ink)",
            backgroundColor: "var(--brand-soft)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--brand)",
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Alerta de bloqueio caso haja despesa sem categoria */}
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
            <b>Atenção:</b> {totals.missingCategoryCount} despesa{totals.missingCategoryCount > 1 ? "s" : ""}{" "}
            selecionada{totals.missingCategoryCount > 1 ? "s estão" : " está"} sem categoria. Escolha a
            categoria de cada uma na tabela ou use a seleção em lote para poder avançar.
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
            <b>Atenção:</b> {totals.missingOwnerCount} receita{totals.missingOwnerCount > 1 ? "s estão" : " está"}{" "}
            sem membro responsável. Receitas e salários precisam ser atribuídos a um membro.
          </span>
        </div>
      )}

      {/* Resumo Dinâmico em Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="cc-card" style={{ padding: "var(--space-3)" }}>
          <div className="caption cc-muted">Lançamentos selecionados</div>
          <div className="title" style={{ fontSize: 22, marginTop: 4 }}>
            {totals.selectedCount} <span className="caption cc-muted">de {totals.totalRows}</span>
          </div>
        </div>

        <div className="cc-card" style={{ padding: "var(--space-3)" }}>
          <div className="caption cc-muted">Total de despesas selecionadas</div>
          <div className="title cc-num" style={{ fontSize: 22, marginTop: 4, color: "var(--ink)" }}>
            {formatBRL(totals.expensesCents)}
          </div>
        </div>

        <div className="cc-card" style={{ padding: "var(--space-3)" }}>
          <div className="caption cc-muted">Total de receitas selecionadas</div>
          <div className="title cc-num" style={{ fontSize: 22, marginTop: 4, color: "var(--brand-ink)" }}>
            {formatBRL(totals.incomesCents)}
          </div>
        </div>
      </div>

      {/* Barra de Filtros (Todas, Novas, Duplicadas, Ignoradas) */}
      <div className="cc-filters" role="group" aria-label="Filtros de situação">
        <button
          type="button"
          className="cc-chip"
          style={{ minHeight: "40px" }}
          aria-pressed={filter === "todas"}
          onClick={() => setFilter("todas")}
        >
          Todas ({counts.todas})
        </button>
        <button
          type="button"
          className="cc-chip"
          style={{ minHeight: "40px" }}
          aria-pressed={filter === "novas"}
          onClick={() => setFilter("novas")}
        >
          Novas ({counts.novas})
        </button>
        <button
          type="button"
          className="cc-chip"
          style={{ minHeight: "40px" }}
          aria-pressed={filter === "duplicadas"}
          onClick={() => setFilter("duplicadas")}
        >
          Duplicadas ({counts.duplicadas})
        </button>
        <button
          type="button"
          className="cc-chip"
          style={{ minHeight: "40px" }}
          aria-pressed={filter === "ignoradas"}
          onClick={() => setFilter("ignoradas")}
        >
          Ignoradas ({counts.ignoradas})
        </button>
      </div>

      {/* Barra de Ações em Lote */}
      <BulkActionsBar
        selectedCount={totals.selectedCount}
        totalVisible={selectableVisibleRows.length}
        allVisibleSelected={allVisibleSelected}
        onToggleSelectAllVisible={handleToggleSelectAllVisible}
        onClearSelection={handleClearSelection}
        onUpdateBulkType={handleBulkType}
        onUpdateBulkCategory={handleBulkCategory}
        onUpdateBulkOwner={handleBulkOwner}
        categories={categories}
        members={members}
        isPending={isPending}
      />

      {/* Desktop Table View */}
      <ReviewTable
        rows={visibleRows}
        selectedIds={selectedIds}
        allVisibleSelected={allVisibleSelected}
        onToggleSelectRow={handleToggleSelectRow}
        onToggleSelectAllVisible={handleToggleSelectAllVisible}
        onUpdateRowType={handleUpdateRowType}
        onUpdateRowCategory={handleUpdateRowCategory}
        onUpdateRowOwner={handleUpdateRowOwner}
        onLinkExpense={handleLinkExpense}
        onClearTransfer={handleClearTransfer}
        onOpenRuleModal={(r) => setRuleModalRow(r)}
        onUpdateRowDescription={handleUpdateRowDescription}
        categories={categories}
        members={members}
        isPending={isPending}
      />

      {/* Mobile Cards View */}
      <ReviewMobileCards
        rows={visibleRows}
        selectedIds={selectedIds}
        onToggleSelectRow={handleToggleSelectRow}
        onUpdateRowType={handleUpdateRowType}
        onUpdateRowCategory={handleUpdateRowCategory}
        onUpdateRowOwner={handleUpdateRowOwner}
        onLinkExpense={handleLinkExpense}
        onClearTransfer={handleClearTransfer}
        onOpenRuleModal={(r) => setRuleModalRow(r)}
        onUpdateRowDescription={handleUpdateRowDescription}
        categories={categories}
        members={members}
        isPending={isPending}
      />

      {/* Espaço reservado para a barra fixa no celular não cobrir o último card */}
      <div className="cc-only-sm" style={{ height: 110 }} aria-hidden="true" />

      {/* Barra fixa de ação no rodapé para telas móveis */}
      <div className="cc-review-bar">
        {totals.canProceedToConfirm ? (
          <Link
            href={`/importar/${batch.id}/confirmar`}
            className="cc-btn cc-btn--primary"
            style={{ width: "100%", textDecoration: "none" }}
          >
            Continuar para confirmação ({totals.selectedCount})
          </Link>
        ) : (
          <>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              style={{ width: "100%" }}
              disabled
              aria-describedby={
                disabledProceedReason ? "mobile-disabled-proceed-reason" : undefined
              }
            >
              Continuar para confirmação ({totals.selectedCount})
            </button>
            {disabledProceedReason && (
              <span
                id="mobile-disabled-proceed-reason"
                role="status"
                className="caption cc-muted"
                style={{
                  textAlign: "center",
                  lineHeight: "1.3",
                  fontSize: 12,
                }}
              >
                {disabledProceedReason}
              </span>
            )}
          </>
        )}
      </div>

      {/* Modal para criar regra */}
      <RuleModal
        isOpen={ruleModalRow !== null}
        row={ruleModalRow}
        batchId={batch.id}
        categories={categories}
        members={members}
        isPending={isPending}
        onClose={() => setRuleModalRow(null)}
        onSaveRule={handleSaveRule}
      />
    </div>
  );
}
