"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { archiveCategory, saveCategory } from "../actions";
import type {
  ActionResponse,
  CategoryColor,
  CategoryItem,
  CategoryNature,
  SaveCategoryInput,
} from "./types";
import { COLOR_OPTIONS } from "./types";

export interface CategorySectionProps {
  categories: CategoryItem[];
  canEdit: boolean;
  onSave?: (input: SaveCategoryInput) => Promise<ActionResponse>;
  onArchive?: (id: string) => Promise<ActionResponse>;
}

export function CategorySection({
  categories,
  canEdit,
  onSave,
  onArchive,
}: CategorySectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("chart-1");
  const [nature, setNature] = useState<CategoryNature>("fixa");
  const [monthlyLimitCents, setMonthlyLimitCents] = useState<number | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setEditingCategory(null);
    setName("");
    setColor("chart-1");
    setNature("fixa");
    setMonthlyLimitCents(null);
    setErrorMessage(null);
  }

  function handleStartEdit(category: CategoryItem) {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color as CategoryColor);
    setNature(category.nature as CategoryNature);
    setMonthlyLimitCents(category.monthlyLimitCents ?? null);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const input: SaveCategoryInput = {
      id: editingCategory?.id,
      name: name.trim(),
      color,
      nature,
      monthlyLimitCents,
    };

    startTransition(async () => {
      try {
        const res: ActionResponse = onSave
          ? await onSave(input)
          : await saveCategory(input);

        if (!res.ok) {
          setErrorMessage(res.error || "Não foi possível salvar o tipo.");
          return;
        }

        resetForm();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao salvar."
        );
      }
    });
  }

  async function handleArchive() {
    if (!editingCategory) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res: ActionResponse = onArchive
          ? await onArchive(editingCategory.id)
          : await archiveCategory({ id: editingCategory.id });

        if (!res.ok) {
          setErrorMessage(res.error || "Não foi possível arquivar o tipo.");
          return;
        }

        resetForm();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Erro inesperado ao arquivar."
        );
      }
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <section
        className="cc-list"
        style={{ flex: "999 1 520px", minWidth: 0 }}
        aria-label="Tipos cadastrados"
      >
        {categories.length === 0 ? (
          <div
            style={{ padding: "var(--space-4)", textAlign: "center" }}
            className="body cc-muted"
          >
            Nenhum tipo cadastrado.
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="cc-expense">
              <div className="cc-expense__icon">
                <span style={{ background: `var(--${cat.color})` }} />
              </div>
              <div className="cc-expense__main">
                <span className="cc-expense__title">{cat.name}</span>
                {/* shortcut: exemplos ("aluguel, lote") sem campo no banco, aguardando o Jefferson */}
                <span className="cc-expense__meta">
                  {cat.nature === "fixa" ? "Fixa" : "Variável"}
                </span>
              </div>
              {canEdit && (
                <div className="cc-expense__side">
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost cc-btn--sm"
                    style={{ minHeight: "40px" }}
                    onClick={() => handleStartEdit(cat)}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {canEdit && (
        <form
          className="cc-card"
          style={{
            flex: "1 1 320px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          onSubmit={handleSubmit}
        >
          <h2 className="title">
            {editingCategory ? "Editar tipo" : "Novo tipo"}
          </h2>

          {errorMessage && (
            <div
              className="caption"
              style={{ color: "var(--danger)" }}
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <label className="cc-field">
            <span className="cc-field__label">Nome</span>
            <span className="cc-input">
              <input
                className="cc-input__text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Educação"
                required
                disabled={isPending}
              />
            </span>
          </label>

          <div className="cc-field">
            <span className="cc-field__label">Cor</span>
            <div className="cc-filters" role="group" aria-label="Cor">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.color}
                  type="button"
                  className="cc-chip"
                  aria-pressed={color === opt.color}
                  aria-label={opt.label}
                  onClick={() => setColor(opt.color)}
                  disabled={isPending}
                  style={{ minWidth: 40, minHeight: 40, justifyContent: "center" }}
                >
                  <span
                    className="cc-chip__dot"
                    style={{
                      background: `var(--${opt.color})`,
                      width: 14,
                      height: 14,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="cc-field">
            <span className="cc-field__label">Natureza</span>
            <div className="cc-seg" role="group" aria-label="Natureza">
              <button
                type="button"
                aria-pressed={nature === "fixa"}
                style={{ minHeight: "40px" }}
                onClick={() => setNature("fixa")}
                disabled={isPending}
              >
                Fixa
              </button>
              <button
                type="button"
                aria-pressed={nature === "variavel"}
                style={{ minHeight: "40px" }}
                onClick={() => setNature("variavel")}
                disabled={isPending}
              >
                Variável
              </button>
            </div>
            <span className="cc-field__hint">
              Fixas aparecem como sugestão de recorrente todo mês.
            </span>
          </div>

          <MoneyInput
            label="Limite mensal (opcional)"
            value={monthlyLimitCents}
            onChange={setMonthlyLimitCents}
            hint="Avisa no dashboard quando passar."
            disabled={isPending}
          />

          {editingCategory ? (
            <div
              style={{
                display: "flex",
                gap: "var(--space-2)",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                className="cc-btn cc-btn--primary"
                disabled={isPending}
              >
                Salvar tipo
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--secondary"
                onClick={resetForm}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--danger"
                onClick={handleArchive}
                disabled={isPending}
              >
                Arquivar
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="cc-btn cc-btn--primary"
              disabled={isPending}
            >
              Salvar tipo
            </button>
          )}
        </form>
      )}
    </div>
  );
}
