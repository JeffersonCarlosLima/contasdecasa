"use client";

import { shortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { formatSignedAmount } from "./helpers";
import { SituationBadge } from "./SituationBadge";
import type { CategoryOption, ImportRowReviewItem, MemberOption } from "./types";

export interface ReviewMobileCardsProps {
  rows: ImportRowReviewItem[];
  selectedIds: Set<string>;
  onToggleSelectRow: (rowId: string) => void;
  onUpdateRowType: (rowId: string, type: "despesa" | "receita" | "salario" | "ignorar") => void;
  onUpdateRowCategory: (rowId: string, categoryId: string | null) => void;
  onUpdateRowOwner: (rowId: string, ownerId: string | null) => void;
  onLinkExpense: (rowId: string, expenseId: string | null) => void;
  onClearTransfer: (rowId: string) => void;
  onOpenRuleModal: (row: ImportRowReviewItem) => void;
  categories: CategoryOption[];
  members: MemberOption[];
  isPending: boolean;
}

export function ReviewMobileCards({
  rows,
  selectedIds,
  onToggleSelectRow,
  onUpdateRowType,
  onUpdateRowCategory,
  onUpdateRowOwner,
  onLinkExpense,
  onClearTransfer,
  onOpenRuleModal,
  categories,
  members,
  isPending,
}: ReviewMobileCardsProps) {
  if (rows.length === 0) {
    return (
      <div className="cc-list cc-only-sm" style={{ padding: "var(--space-4)", textAlign: "center" }}>
        <p className="body cc-muted">Nenhum lançamento encontrado para este filtro.</p>
      </div>
    );
  }

  return (
    <div className="cc-list cc-only-sm" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((row) => {
        const isSelected = selectedIds.has(row.id);
        const isExpense = row.type === "despesa";
        const isIncome = row.type === "receita" || row.type === "salario";
        const isMissingCategory = isExpense && !row.categoryId && isSelected;
        const isMissingOwner = isIncome && !row.ownerMemberId && isSelected;

        return (
          <div
            key={row.id}
            className="cc-card"
            style={{
              padding: "var(--space-3)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              backgroundColor: isSelected
                ? "var(--surface-raised)"
                : "var(--surface-sunken)",
              opacity: row.type === "ignorar" ? 0.65 : 1,
              border: isMissingCategory || isMissingOwner ? "1px solid var(--danger)" : undefined,
              boxShadow: isMissingCategory || isMissingOwner ? "inset 3px 0 0 var(--danger)" : undefined,
            }}
          >
            {/* Top row: Checkbox, Date & Value */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  className="cc-check"
                  style={{
                    margin: 0,
                    minHeight: "40px",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectRow(row.id)}
                    disabled={isPending}
                    aria-label={`Selecionar ${row.descriptionOriginal}`}
                  />
                </label>
                <span className="caption cc-muted">{shortDate(row.date)}</span>
              </div>

              <span
                className="cc-num"
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: row.amountCents > 0 ? "var(--brand-ink)" : "var(--ink)",
                }}
              >
                {formatSignedAmount(row.amountCents)}
              </span>
            </div>

            {/* Description */}
            <div>
              <div style={{ fontWeight: 600 }}>{row.descriptionOriginal}</div>
              {row.ignoreReason && (
                <div className="caption cc-muted">Motivo: {row.ignoreReason}</div>
              )}
            </div>

            {/* Badges: Situation & Type */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <SituationBadge situation={row.situation} />

              <select
                className="cc-select"
                style={{ height: 40, fontSize: 13, flex: 1 }}
                value={row.type}
                onChange={(e) =>
                  onUpdateRowType(
                    row.id,
                    e.target.value as "despesa" | "receita" | "salario" | "ignorar"
                  )
                }
                disabled={isPending}
                aria-label={`Tipo de ${row.descriptionOriginal}`}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="salario">Salário</option>
                <option value="ignorar">Ignorar</option>
              </select>
            </div>

            {/* Category / Owner inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {isExpense && (
                <div>
                  <label
                    htmlFor={`m-cat-select-${row.id}`}
                    className="caption cc-muted"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Categoria {isMissingCategory && <span style={{ color: "var(--danger)" }}>* obrigatória</span>}
                  </label>
                  <select
                    id={`m-cat-select-${row.id}`}
                    className={`cc-select ${isMissingCategory ? "cc-input--error" : ""}`}
                    style={{
                      height: 40,
                      width: "100%",
                      fontSize: 13,
                      borderColor: isMissingCategory ? "var(--danger)" : undefined,
                    }}
                    value={row.categoryId ?? ""}
                    onChange={(e) => onUpdateRowCategory(row.id, e.target.value || null)}
                    disabled={isPending}
                    aria-label={`Categoria de ${row.descriptionOriginal}`}
                    aria-invalid={isMissingCategory ? true : undefined}
                    aria-describedby={isMissingCategory ? `m-cat-err-${row.id}` : undefined}
                  >
                    <option value="" disabled={Boolean(row.categoryId)}>
                      {row.categoryId ? "Sem categoria" : "Selecione a categoria *"}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {isMissingCategory && (
                    <span
                      id={`m-cat-err-${row.id}`}
                      className="caption"
                      style={{ color: "var(--danger)", display: "block", marginTop: 4 }}
                      role="alert"
                    >
                      Categoria obrigatória
                    </span>
                  )}

                  {row.categoryId && (
                    <button
                      type="button"
                      className="caption cc-muted"
                      style={{
                        background: "transparent",
                        border: 0,
                        padding: "8px 0",
                        minHeight: "40px",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "var(--brand-ink)",
                      }}
                      onClick={() => onOpenRuleModal(row)}
                    >
                      Lembrar para descrições parecidas
                    </button>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor={`m-owner-select-${row.id}`}
                  className="caption cc-muted"
                  style={{ display: "block", marginBottom: 2 }}
                >
                  Dono {isMissingOwner && <span style={{ color: "var(--danger)" }}>* obrigatório</span>}
                </label>
                <select
                  id={`m-owner-select-${row.id}`}
                  className={`cc-select ${isMissingOwner ? "cc-input--error" : ""}`}
                  style={{
                    height: 40,
                    width: "100%",
                    fontSize: 13,
                    borderColor: isMissingOwner ? "var(--danger)" : undefined,
                  }}
                  value={row.ownerMemberId ?? ""}
                  onChange={(e) => onUpdateRowOwner(row.id, e.target.value || null)}
                  disabled={isPending || row.type === "ignorar"}
                  aria-label={`Responsável por ${row.descriptionOriginal}`}
                  aria-invalid={isMissingOwner ? true : undefined}
                  aria-describedby={isMissingOwner ? `m-owner-err-${row.id}` : undefined}
                >
                  <option value="" disabled={isIncome}>
                    {isIncome ? "Selecione o membro *" : "Família (dividir)"}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
                </select>

                {isMissingOwner && (
                  <span
                    id={`m-owner-err-${row.id}`}
                    className="caption"
                    style={{ color: "var(--danger)", display: "block", marginTop: 4 }}
                    role="alert"
                  >
                    Membro obrigatório
                  </span>
                )}
              </div>
            </div>

            {/* Contextual link / transfer */}
            {row.situation === "possivel_vinculo" && row.matchedExpense && (
              <div
                style={{
                  padding: "var(--space-2)",
                  backgroundColor: "var(--surface-sunken)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div>
                  <b>Despesa candidata:</b> {row.matchedExpense.description} (
                  {formatBRL(row.matchedExpense.amountCents)}) em {shortDate(row.matchedExpense.dueDate)}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {row.linkedExpenseId === row.matchedExpense.id ? (
                    <span className="caption" style={{ color: "var(--brand-ink)", fontWeight: 600 }}>
                      Vinculada ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="cc-btn cc-btn--ghost cc-btn--sm"
                      style={{ minHeight: "40px" }}
                      onClick={() => onLinkExpense(row.id, row.matchedExpense!.id)}
                      disabled={isPending}
                    >
                      Vincular e marcar como Pago
                    </button>
                  )}
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost cc-btn--sm"
                    style={{ minHeight: "40px" }}
                    onClick={() => onLinkExpense(row.id, null)}
                    disabled={isPending || row.linkedExpenseId === null}
                  >
                    Criar nova
                  </button>
                </div>
              </div>
            )}

            {row.linkedRowId && (
              <div
                style={{
                  padding: "var(--space-2)",
                  backgroundColor: "var(--brand-soft)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <span>Transferência interna</span>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost cc-btn--sm"
                  style={{ minHeight: "40px" }}
                  onClick={() => onClearTransfer(row.id)}
                  disabled={isPending}
                >
                  Desfazer sugestão
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
