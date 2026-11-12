"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CategoryOption, ImportRowReviewItem, MemberOption } from "./types";

export interface RuleModalProps {
  isOpen: boolean;
  row: ImportRowReviewItem | null;
  batchId: string;
  categories: CategoryOption[];
  members: MemberOption[];
  isPending: boolean;
  onClose: () => void;
  onSaveRule: (params: {
    batchId: string;
    rowId: string;
    matchType: "contem" | "comeca";
    pattern: string;
    displayName?: string | null;
    categoryId: string;
    ownerId?: string | null;
  }) => Promise<void>;
}

export function RuleModal({
  isOpen,
  row,
  batchId,
  categories,
  members,
  isPending,
  onClose,
  onSaveRule,
}: RuleModalProps) {
  const titleId = useId();
  const patternId = useId();
  const matchTypeId = useId();
  const displayNameId = useId();
  const categoryId = useId();
  const ownerId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [pattern, setPattern] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [matchType, setMatchType] = useState<"contem" | "comeca">("contem");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (row) {
      setPattern(row.descriptionNormalized || row.descriptionOriginal);
      setDisplayName(row.descriptionEdited ?? "");
      setMatchType("contem");
      setSelectedCatId(row.categoryId || categories[0]?.id || "");
      setSelectedOwnerId(row.ownerMemberId || null);
      setError(null);
    }
  }, [row, categories]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const input = dialogRef.current?.querySelector<HTMLInputElement>(`#${patternId}`);
      input?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableEls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableEls || focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, isPending, onClose, patternId]);

  if (!isOpen || !row) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pattern.trim()) {
      setError("Informe o texto ou trecho para a regra.");
      return;
    }
    if (!selectedCatId) {
      setError("Selecione uma categoria.");
      return;
    }

    try {
      await onSaveRule({
        batchId,
        rowId: row!.id,
        matchType,
        pattern: pattern.trim(),
        displayName: displayName.trim() ? displayName.trim() : null,
        categoryId: selectedCatId,
        ownerId: selectedOwnerId,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar regra.");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        backgroundColor: "rgba(29, 36, 33, 0.45)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="cc-card"
        style={{
          width: "100%",
          maxWidth: "480px",
          boxShadow: "var(--shadow-pop)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h2 id={titleId} className="title" style={{ margin: 0 }}>
            Lembrar para descrições parecidas
          </h2>
          <p className="body cc-muted" style={{ margin: 0 }}>
            Lançamentos futuros que corresponderem ao padrão abaixo receberão automaticamente esta categoria e, se preenchido, o nome que você definiu.
          </p>
        </div>

        {error && (
          <div role="alert" className="cc-field__hint cc-field__hint--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <label className="cc-field" htmlFor={patternId}>
            <span className="cc-field__label">Padrão de texto a identificar</span>
            <span className="cc-input">
              <input
                id={patternId}
                className="cc-input__text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                disabled={isPending}
                placeholder="Ex.: supermercado"
              />
            </span>
          </label>

          <label className="cc-field" htmlFor={displayNameId}>
            <span className="cc-field__label">Nome a usar na despesa (opcional)</span>
            <span className="cc-input">
              <input
                id={displayNameId}
                className="cc-input__text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isPending}
                maxLength={120}
                placeholder="Ex.: Mercado do bairro"
              />
            </span>
          </label>

          <label className="cc-field" htmlFor={matchTypeId}>
            <span className="cc-field__label">Tipo de correspondência</span>
            <select
              id={matchTypeId}
              className="cc-select"
              style={{ height: 44 }}
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as "contem" | "comeca")}
              disabled={isPending}
            >
              <option value="contem">Contém o texto</option>
              <option value="comeca">Começa com o texto</option>
            </select>
          </label>

          <label className="cc-field" htmlFor={categoryId}>
            <span className="cc-field__label">Categoria padrão</span>
            <select
              id={categoryId}
              className="cc-select"
              style={{ height: 44 }}
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              disabled={isPending}
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="cc-field" htmlFor={ownerId}>
            <span className="cc-field__label">Dono padrão (opcional)</span>
            <select
              id={ownerId}
              className="cc-select"
              style={{ height: 44 }}
              value={selectedOwnerId ?? ""}
              onChange={(e) => setSelectedOwnerId(e.target.value || null)}
              disabled={isPending}
            >
              <option value="">Família (compartilhada)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </label>

          <div className="cc-formfoot" style={{ marginTop: "var(--space-2)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
              style={{ minHeight: "40px" }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              style={{ minHeight: "40px" }}
            >
              {isPending ? "Salvando regra…" : "Salvar regra"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
