"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { formatMonthLong } from "./format-utils";
import type { BatchImportSummary } from "./batch-summary";

export interface ImportBatchBannerProps {
  summary: BatchImportSummary;
}

export function ImportBatchBanner({ summary }: ImportBatchBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  function handleDismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("lote");
      const newQuery = url.searchParams.toString();
      const newUrl = url.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }

  const {
    currentMonth,
    currentMonthCount,
    otherMonths,
    incomesCount,
    incomesMonth,
    linkedCount,
  } = summary;

  const currentMonthExtenso = formatMonthLong(currentMonth);

  // 1. Mensagem principal de despesas no mês
  const expenseMainText =
    currentMonthCount === 1
      ? `1 despesa importada em ${currentMonthExtenso}.`
      : `${currentMonthCount} despesas importadas em ${currentMonthExtenso}.`;

  // 2. Outros meses
  const totalOther = otherMonths.reduce((sum, item) => sum + item.count, 0);

  // 3. Receitas
  const targetIncomeMonth = incomesMonth || currentMonth;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--line)",
        borderLeft: "4px solid var(--invest)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-3)",
          flex: 1,
          minWidth: 0,
        }}
      >
        <CheckCircle2
          size={20}
          style={{ color: "var(--invest)", flexShrink: 0, marginTop: 2 }}
          aria-hidden="true"
        />
        <div
          style={{
            font: "400 14px/20px var(--font-sans)",
            color: "var(--ink)",
            wordBreak: "break-word",
          }}
        >
          <span>{expenseMainText}</span>{" "}
          {totalOther > 0 && (
            <span>
              {totalOther === 1
                ? "Outra 1 ficou em "
                : `Outras ${totalOther} ficaram em `}
              {otherMonths.map((item, idx) => {
                const isLast = idx === otherMonths.length - 1;
                const isSecondToLast = idx === otherMonths.length - 2;
                const separator = isLast ? "" : isSecondToLast ? " e " : ", ";
                const label = formatMonthLong(item.month);
                return (
                  <span key={item.month}>
                    <Link
                      href={`/despesas?mes=${item.month}`}
                      style={{
                        color: "var(--brand-ink)",
                        fontWeight: 600,
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {label}
                    </Link>
                    {otherMonths.length > 1 ? ` (${item.count})` : ""}
                    {separator}
                  </span>
                );
              })}
              .{" "}
            </span>
          )}
          {incomesCount > 0 && (
            <span>
              {incomesCount === 1
                ? "1 receita foi para a renda em "
                : `${incomesCount} receitas foram para a renda em `}
              <Link
                href={`/mes?mes=${targetIncomeMonth}`}
                style={{
                  color: "var(--brand-ink)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Fechamento do mês
              </Link>
              .{" "}
            </span>
          )}
          {linkedCount > 0 && (
            <span>
              {linkedCount === 1
                ? "1 vinculada a despesa existente."
                : `${linkedCount} vinculadas a despesas existentes.`}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="cc-btn cc-btn--ghost cc-btn--sm"
        onClick={handleDismiss}
        aria-label="Fechar aviso"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 40,
          minHeight: 40,
          width: 40,
          height: 40,
          margin: "-6px -8px -6px 0",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
