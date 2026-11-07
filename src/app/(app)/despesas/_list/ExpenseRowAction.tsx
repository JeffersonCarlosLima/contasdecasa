"use client";

import { useTransition } from "react";
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

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (disabled || isPending) return;

    startTransition(async () => {
      try {
        if (isPaid) {
          await unmarkPaid(id);
        } else {
          await markPaid(id);
        }
        router.refresh();
      } catch (err) {
        console.error("Erro ao alterar pagamento:", err);
      }
    });
  }

  return (
    <button
      type="button"
      className="cc-btn cc-btn--ghost cc-btn--sm"
      disabled={disabled || isPending}
      onClick={handleClick}
      aria-label={isPaid ? "Desfazer pagamento" : "Marcar como paga"}
    >
      {isPaid ? "Desfazer" : "Marcar como paga"}
    </button>
  );
}
