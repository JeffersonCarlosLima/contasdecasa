"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

export type ScopeActionType = "save" | "delete";

export interface ScopeModalProps {
  isOpen: boolean;
  actionType: ScopeActionType;
  isSequence: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (scope: "esta" | "proximas") => void;
}

export function ScopeModal({
  isOpen,
  actionType,
  isSequence,
  isPending,
  onClose,
  onConfirm,
}: ScopeModalProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        focusables[0]?.focus();
      }
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
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const isDelete = actionType === "delete";

  const title = isDelete ? "Excluir despesa" : "Salvar alterações";

  const description = isSequence
    ? isDelete
      ? "Esta despesa faz parte de uma sequência. Como deseja excluir?"
      : "Esta despesa faz parte de uma sequência. Como deseja aplicar as alterações?"
    : "Tem certeza que deseja excluir esta despesa?";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
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
          maxWidth: "460px",
          boxShadow: "var(--shadow-pop)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h2 id={titleId} className="title" style={{ margin: 0 }}>
            {title}
          </h2>
          <p id={descId} className="body cc-muted" style={{ margin: 0 }}>
            {description}
          </p>
        </div>

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

          {isSequence ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => onConfirm("esta")}
                style={{ minHeight: "40px" }}
              >
                {isPending ? "Aguarde…" : "Só esta"}
              </Button>
              <Button
                type="button"
                variant={isDelete ? "danger" : "primary"}
                disabled={isPending}
                onClick={() => onConfirm("proximas")}
                style={{ minHeight: "40px" }}
              >
                {isPending ? "Aguarde…" : "Esta e as próximas"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() => onConfirm("esta")}
              style={{ minHeight: "40px" }}
            >
              {isPending ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
