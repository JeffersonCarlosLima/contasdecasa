"use client";

import { useId } from "react";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatInvestHint } from "./helpers";
import type { InvestMode } from "@/lib/calc";

interface InvestCardProps {
  mode: InvestMode;
  value: number; // centavos se valor, pontos-base se percentual
  destination: string;
  totalIncomeCents: number;
  monthName: string;
  onModeChange: (mode: InvestMode) => void;
  onValueChange: (val: number) => void;
  onDestinationChange: (dest: string) => void;
  readOnly: boolean;
}

export function InvestCard({
  mode,
  value,
  destination,
  totalIncomeCents,
  monthName,
  onModeChange,
  onValueChange,
  onDestinationChange,
  readOnly,
}: InvestCardProps) {
  const percentId = useId();
  const hintText = formatInvestHint(mode, value, totalIncomeCents, monthName);

  return (
    <section
      className="cc-card cc-kpi--invest"
      style={{ display: "flex", flexDirection: "column", gap: "16px", borderColor: "transparent" }}
    >
      <h2 className="title">Investimento do mês</h2>

      <div
        className="cc-seg"
        role="group"
        aria-label="Forma do investimento"
        style={{ background: "var(--surface-raised)", alignSelf: "flex-start" }}
      >
        <button
          type="button"
          aria-pressed={mode === "valor"}
          style={{
            minHeight: "40px",
            ...(mode === "valor" ? { background: "var(--invest-soft)" } : {}),
          }}
          onClick={() => !readOnly && onModeChange("valor")}
          disabled={readOnly}
        >
          Valor fixo
        </button>
        <button
          type="button"
          aria-pressed={mode === "percentual"}
          style={{
            minHeight: "40px",
            ...(mode === "percentual" ? { background: "var(--invest-soft)" } : {}),
          }}
          onClick={() => !readOnly && onModeChange("percentual")}
          disabled={readOnly}
        >
          % da renda
        </button>
      </div>

      <div className="cc-form">
        {mode === "valor" ? (
          <MoneyInput
            label="Quanto vão investir"
            value={value}
            onChange={(val) => onValueChange(val ?? 0)}
            hint={hintText}
            disabled={readOnly}
          />
        ) : (
          <div className="cc-field">
            <label className="cc-field__label" htmlFor={percentId}>
              Quanto vão investir
            </label>
            <span className="cc-input">
              <span className="cc-input__prefix">%</span>
              <input
                id={percentId}
                className="cc-input__text"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={value > 0 ? (value / 100).toString() : ""}
                placeholder="Ex.: 15"
                disabled={readOnly}
                onChange={(e) => {
                  const num = parseFloat(e.target.value.replace(",", "."));
                  const bp = isNaN(num) ? 0 : Math.round(num * 100);
                  onValueChange(bp);
                }}
              />
            </span>
            <span className="cc-field__hint">{hintText}</span>
          </div>
        )}

        <label className="cc-field">
          <span className="cc-field__label">Onde</span>
          <span className="cc-input">
            <input
              className="cc-input__text"
              type="text"
              value={destination}
              placeholder="Ex.: Reserva de emergência"
              disabled={readOnly}
              onChange={(e) => onDestinationChange(e.target.value)}
            />
          </span>
        </label>
      </div>
    </section>
  );
}
