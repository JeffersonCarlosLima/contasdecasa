"use client";

import { shortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { formatSignedAmount, isRowSelectable } from "./helpers";
import { DescriptionCell } from "./DescriptionCell";
import { SituationBadge } from "./SituationBadge";
import type { CategoryOption, ImportRowReviewItem, MemberOption } from "./types";

export interface ReviewTableProps {
  rows: ImportRowReviewItem[];
  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  onToggleSelectRow: (rowId: string) => void;
  onToggleSelectAllVisible: () => void;
  onUpdateRowType: (rowId: string, type: "despesa" | "receita" | "salario" | "ignorar") => void;
  onUpdateRowCategory: (rowId: string, categoryId: string | null) => void;
  onUpdateRowOwner: (rowId: string, ownerId: string | null) => void;
  onLinkExpense: (rowId: string, expenseId: string | null) => void;
  onClearTransfer: (rowId: string) => void;
  onOpenRuleModal: (row: ImportRowReviewItem) => void;
  onUpdateRowDescription: (rowId: string, description: string | null) => void;
  categories: CategoryOption[];
  members: MemberOption[];
  isPending: boolean;
}

export function ReviewTable({
  rows,
  selectedIds,
  allVisibleSelected,
  onToggleSelectRow,
  onToggleSelectAllVisible,
  onUpdateRowType,
  onUpdateRowCategory,
  onUpdateRowOwner,
  onLinkExpense,
  onClearTransfer,
  onOpenRuleModal,
  onUpdateRowDescription,
  categories,
  members,
  isPending,
}: ReviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="cc-tablebox cc-hide-sm" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p className="body cc-muted">Nenhum lançamento encontrado para este filtro.</p>
      </div>
    );
  }

  return (
    <div className="cc-tablebox cc-hide-sm">
      <table className="cc-table" aria-label="Revisão de lançamentos">
        <thead>
          <tr>
            <th style={{ width: 44, textAlign: "center" }}>
              <label
                className="cc-check"
                style={{
                  margin: 0,
                  minHeight: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAllVisible}
                  disabled={isPending}
                  aria-label="Selecionar todas as linhas visíveis"
                />
              </label>
            </th>
            <th>Data</th>
            <th>Descrição</th>
            <th style={{ textAlign: "right" }}>Valor</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Dono</th>
            <th>Situação</th>
            <th>Vínculo / Contexto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelectable = isRowSelectable(row);
            const isIgnored = !isSelectable;
            const isSelected = selectedIds.has(row.id) && isSelectable;
            const isExpense = row.type === "despesa";
            const isIncome = row.type === "receita" || row.type === "salario";
            const isMissingCategory = isExpense && !row.categoryId && isSelected;
            const isMissingOwner = isIncome && !row.ownerMemberId && isSelected;

            return (
              <tr
                key={row.id}
                style={{
                  backgroundColor: isSelected
                    ? "var(--surface-raised)"
                    : "var(--surface-sunken)",
                  opacity: isIgnored ? 0.65 : 1,
                  boxShadow:
                    isMissingCategory || isMissingOwner
                      ? "inset 3px 0 0 var(--danger)"
                      : undefined,
                }}
              >
                {/* 1. Checkbox */}
                <td style={{ textAlign: "center" }}>
                  <label
                    className="cc-check"
                    style={{
                      margin: 0,
                      minHeight: "40px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: !isSelectable ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(row.id)}
                      disabled={isPending || !isSelectable}
                      aria-describedby={
                        !isSelectable ? `table-ignore-reason-${row.id}` : undefined
                      }
                      aria-label={`Selecionar lançamento ${row.descriptionOriginal}`}
                    />
                  </label>
                </td>

                {/* 2. Data */}
                <td style={{ whiteSpace: "nowrap" }}>{shortDate(row.date)}</td>

                {/* 3. Descrição (estritamente como texto) */}
                <td>
<DescriptionCell row={row} disabled={isPending} onChange={onUpdateRowDescription} />
                  {!isSelectable && (
                    <div
                      id={`table-ignore-reason-${row.id}`}
                      className="caption cc-muted"
                      style={{ marginTop: 2 }}
                    >
                      Ignorada: não será gravada
                    </div>
                  )}
                  {row.ignoreReason && (
                    <div className="caption cc-muted" style={{ marginTop: 2 }}>
                      Motivo: {row.ignoreReason}
                    </div>
                  )}
                </td>

                {/* 4. Valor com sinal */}
                <td
                  className="cc-num"
                  style={{
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    color:
                      row.amountCents > 0
                        ? "var(--brand-ink)"
                        : "var(--ink)",
                  }}
                >
                  {formatSignedAmount(row.amountCents)}
                </td>

                {/* 5. Tipo */}
                <td>
                  <select
                    className="cc-select"
                    style={{ height: 38, fontSize: 13, minWidth: 105 }}
                    value={row.type}
                    onChange={(e) =>
                      onUpdateRowType(
                        row.id,
                        e.target.value as "despesa" | "receita" | "salario" | "ignorar"
                      )
                    }
                    disabled={isPending}
                    aria-label={`Tipo de lançamento para ${row.descriptionOriginal}`}
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                    <option value="salario">Salário</option>
                    <option value="ignorar">Ignorar</option>
                  </select>
                </td>

                {/* 6. Categoria */}
                <td>
                  {isExpense ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <select
                        id={`table-cat-select-${row.id}`}
                        className={`cc-select ${isMissingCategory ? "cc-input--error" : ""}`}
                        style={{
                          height: 38,
                          fontSize: 13,
                          borderColor: isMissingCategory ? "var(--danger)" : undefined,
                        }}
                        value={row.categoryId ?? ""}
                        onChange={(e) =>
                          onUpdateRowCategory(row.id, e.target.value || null)
                        }
                        disabled={isPending}
                        aria-label={`Categoria para ${row.descriptionOriginal}`}
                        aria-invalid={isMissingCategory ? true : undefined}
                        aria-describedby={
                          isMissingCategory ? `table-cat-err-${row.id}` : undefined
                        }
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
                          id={`table-cat-err-${row.id}`}
                          className="caption"
                          style={{ color: "var(--danger)" }}
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
                            padding: "2px 0",
                            cursor: "pointer",
                            textAlign: "left",
                            textDecoration: "underline",
                            color: "var(--brand-ink)",
                          }}
                          onClick={() => onOpenRuleModal(row)}
                        >
                          Lembrar regra
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="cc-muted">—</span>
                  )}
                </td>

                {/* 7. Dono */}
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <select
                      id={`table-owner-select-${row.id}`}
                      className={`cc-select ${isMissingOwner ? "cc-input--error" : ""}`}
                      style={{
                        height: 38,
                        fontSize: 13,
                        borderColor: isMissingOwner ? "var(--danger)" : undefined,
                      }}
                      value={row.ownerMemberId ?? ""}
                      onChange={(e) =>
                        onUpdateRowOwner(row.id, e.target.value || null)
                      }
                      disabled={isPending || isIgnored}
                      aria-label={`Responsável por ${row.descriptionOriginal}`}
                      aria-invalid={isMissingOwner ? true : undefined}
                      aria-describedby={
                        isMissingOwner ? `table-owner-err-${row.id}` : undefined
                      }
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
                        id={`table-owner-err-${row.id}`}
                        className="caption"
                        style={{ color: "var(--danger)" }}
                        role="alert"
                      >
                        Membro obrigatório
                      </span>
                    )}
                  </div>
                </td>

                {/* 8. Situação */}
                <td>
                  <SituationBadge situation={row.situation} />
                </td>

                {/* 9. Vínculo / Contexto */}
                <td>
                  {row.situation === "possivel_vinculo" && row.matchedExpense && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        padding: "6px 8px",
                        backgroundColor: "var(--surface-sunken)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <b>Candidata:</b> {row.matchedExpense.description} (
                        {formatBRL(row.matchedExpense.amountCents)}) em{" "}
                        {shortDate(row.matchedExpense.dueDate)}
                      </div>

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {row.linkedExpenseId === row.matchedExpense.id ? (
                          <span
                            className="caption"
                            style={{ color: "var(--brand-ink)", fontWeight: 600 }}
                          >
                            Vinculada ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="cc-btn cc-btn--ghost cc-btn--sm"
                            style={{ minHeight: "36px", fontSize: 12, padding: "0 8px" }}
                            onClick={() =>
                              onLinkExpense(row.id, row.matchedExpense!.id)
                            }
                            disabled={isPending}
                          >
                            Vincular e marcar como Pago
                          </button>
                        )}

                        <button
                          type="button"
                          className="cc-btn cc-btn--ghost cc-btn--sm"
                          style={{ minHeight: "36px", fontSize: 12, padding: "0 8px" }}
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        padding: "6px 8px",
                        backgroundColor: "var(--brand-soft)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 12,
                      }}
                    >
                      <span>Transferência interna</span>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost cc-btn--sm"
                        style={{ minHeight: "36px", fontSize: 12, padding: "0 8px" }}
                        onClick={() => onClearTransfer(row.id)}
                        disabled={isPending}
                      >
                        Desfazer sugestão
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
