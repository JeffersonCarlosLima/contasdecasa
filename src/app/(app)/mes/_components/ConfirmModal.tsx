"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  isPending,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables && focusables.length > 0) {
        focusables[0]?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Tab") {
        const focusableEls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

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
        if (e.target === e.currentTarget) {
          onCancel();
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
        <h2 id={titleId} className="title" style={{ margin: 0 }}>
          {title}
        </h2>
        <div className="body cc-muted" style={{ margin: 0 }}>
          {description}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Processando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
