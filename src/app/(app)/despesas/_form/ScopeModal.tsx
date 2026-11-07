"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      aria-label={title}
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
          <h2 className="title" style={{ margin: 0 }}>
            {title}
          </h2>
          <p className="body cc-muted" style={{ margin: 0 }}>
            {description}
          </p>
        </div>

        <div className="cc-formfoot" style={{ marginTop: "var(--space-2)" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
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
              >
                {isPending ? "Aguarde…" : "Só esta"}
              </Button>
              <Button
                type="button"
                variant={isDelete ? "danger" : "primary"}
                disabled={isPending}
                onClick={() => onConfirm("proximas")}
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
            >
              {isPending ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
