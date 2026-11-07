"use client";

import type { CategoryOption, MemberOption } from "./types";

export interface BulkActionsBarProps {
  selectedCount: number;
  totalVisible: number;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onUpdateBulkType: (type: "despesa" | "receita" | "salario" | "ignorar") => void;
  onUpdateBulkCategory: (categoryId: string) => void;
  onUpdateBulkOwner: (ownerId: string | null) => void;
  categories: CategoryOption[];
  members: MemberOption[];
  isPending: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalVisible,
  allVisibleSelected,
  onToggleSelectAllVisible,
  onClearSelection,
  onUpdateBulkType,
  onUpdateBulkCategory,
  onUpdateBulkOwner,
  categories,
  members,
  isPending,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Ações em massa"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        backgroundColor: "var(--brand-soft)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--brand)",
        marginBottom: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <label
          className="cc-check"
          style={{
            margin: 0,
            minHeight: "40px",
            display: "inline-flex",
            alignItems: "center",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleSelectAllVisible}
            disabled={isPending || totalVisible === 0}
            aria-label="Selecionar todas as linhas visíveis"
          />
          <span>
            {selectedCount} de {totalVisible} selecionada{selectedCount > 1 ? "s" : ""}
          </span>
        </label>

        <button
          type="button"
          className="cc-btn cc-btn--ghost cc-btn--sm"
          style={{ minHeight: "40px" }}
          onClick={onClearSelection}
          disabled={isPending}
        >
          Limpar seleção
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <span className="caption cc-muted">Alterar selecionadas:</span>

        {/* Tipo em lote */}
        <select
          className="cc-select"
          style={{ height: 40, fontSize: 13 }}
          defaultValue=""
          aria-label="Alterar tipo em massa"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.value) {
              onUpdateBulkType(e.target.value as "despesa" | "receita" | "salario" | "ignorar");
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>
            Tipo…
          </option>
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
          <option value="salario">Salário</option>
          <option value="ignorar">Ignorar</option>
        </select>

        {/* Categoria em lote */}
        <select
          className="cc-select"
          style={{ height: 40, fontSize: 13 }}
          defaultValue=""
          aria-label="Alterar categoria em massa"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.value) {
              onUpdateBulkCategory(e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>
            Categoria…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Dono em lote */}
        <select
          className="cc-select"
          style={{ height: 40, fontSize: 13 }}
          defaultValue=""
          aria-label="Alterar responsável em massa"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.value) {
              const val = e.target.value === "familia" ? null : e.target.value;
              onUpdateBulkOwner(val);
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>
            Dono…
          </option>
          <option value="familia">Família (dividir)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
