"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copyRecurring } from "@/app/(app)/mes/actions";
import { getMonthNameLower } from "./helpers";

interface DashboardEmptyProps {
  month: string;
  monthLabel: string;
}

export function DashboardEmpty({ month, monthLabel }: DashboardEmptyProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const monthName = getMonthNameLower(monthLabel);

  const handleCopy = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await copyRecurring(month);
      if (res.ok) {
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  return (
    <div
      className="cc-card"
      style={{
        textAlign: "center",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <p className="body cc-muted" style={{ margin: 0, maxWidth: "480px" }}>
        Nenhuma despesa em {monthName}. Lance a primeira ou copie as recorrentes do mês passado.
      </p>

      {feedback && (
        <span className="caption" style={{ color: "var(--danger)" }}>
          {feedback}
        </span>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/despesas/nova"
          className="cc-btn cc-btn--primary"
          style={{ textDecoration: "none" }}
        >
          Lançar despesa
        </Link>
        <button
          type="button"
          onClick={handleCopy}
          disabled={isPending}
          className="cc-btn cc-btn--secondary"
        >
          {isPending ? "Copiando..." : "Copiar recorrentes"}
        </button>
      </div>
    </div>
  );
}
