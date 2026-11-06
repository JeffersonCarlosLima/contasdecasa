"use client";

import { useId, useState } from "react";
import { formatBRL, parseBRL } from "@/lib/money";
import { cx } from "./cx";

export interface MoneyInputProps {
  label: string;
  /** Centavos inteiros. */
  value: number | null;
  onChange: (cents: number | null) => void;
  name?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

/** Campo R$ com rótulo sempre visível. Guarda e envia centavos inteiros. */
export function MoneyInput({ label, value, onChange, name, hint, error, disabled }: MoneyInputProps) {
  const id = useId();
  const fmt = (c: number | null) => (c === null ? "" : formatBRL(c).replace("R$ ", ""));
  const [text, setText] = useState(fmt(value));
  return (
    <div className="cc-field">
      <label className="cc-field__label" htmlFor={id}>{label}</label>
      <span className={cx("cc-input", error && "cc-input--error")}>
        <span className="cc-input__prefix">R$</span>
        <input
          id={id}
          inputMode="decimal"
          disabled={disabled}
          value={text}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseBRL(e.target.value));
          }}
          onBlur={() => setText(fmt(parseBRL(text)))}
        />
      </span>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {(error || hint) && (
        <span id={`${id}-hint`} className={cx("cc-field__hint", error && "cc-field__hint--error")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
