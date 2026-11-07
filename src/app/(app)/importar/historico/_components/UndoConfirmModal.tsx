"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface UndoConfirmModalProps {
  isOpen: boolean;
  filename: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UndoConfirmModal({
  isOpen,
  filename,
  isPending,
  onConfirm,
  onCancel,
}: UndoConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="cc-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
          background: "var(--surface-raised)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2 id={titleId} className="title" style={{ color: "var(--danger)" }}>
            Desfazer importação?
          </h2>
          <p id={descId} className="body cc-muted" style={{ margin: 0, lineHeight: 1.5 }}>
            Deseja desfazer a importação de <strong>{filename}</strong>? Os lançamentos criados
            por este lote serão marcados como desfeitos. Você poderá importar o arquivo novamente
            mais tarde se desejar.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
            style={{ minHeight: "40px" }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            style={{ minHeight: "40px" }}
          >
            {isPending ? "Desfazendo..." : "Confirmar e desfazer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
