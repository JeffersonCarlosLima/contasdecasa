"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaid, unmarkPaid } from "../actions";

export interface ExpenseRowActionProps {
  id: string;
  isPaid: boolean;
  disabled?: boolean;
}

export function ExpenseRowAction({
  id,
  isPaid,
  disabled = false,
}: ExpenseRowActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (disabled || isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = isPaid ? await unmarkPaid(id) : await markPaid(id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Não foi possível atualizar. Tente novamente.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="cc-btn cc-btn--ghost cc-btn--sm"
        style={{ minHeight: "40px" }}
        disabled={disabled || isPending}
        aria-busy={isPending}
        onClick={handleClick}
        aria-label={isPaid ? "Desfazer pagamento" : "Marcar como paga"}
      >
        {isPending ? "Salvando…" : isPaid ? "Desfazer" : "Marcar como paga"}
      </button>
      {error && (
        <span className="caption" role="alert" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </>
  );
}
