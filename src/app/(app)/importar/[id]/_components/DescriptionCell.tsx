"use client";

import { useEffect, useState } from "react";
import type { ImportRowReviewItem } from "./types";

export interface DescriptionCellProps {
  row: ImportRowReviewItem;
  disabled: boolean;
  onChange: (rowId: string, description: string | null) => void;
}

/** Descrição editável do lançamento; vazio volta para o texto original do extrato. */
export function DescriptionCell({ row, disabled, onChange }: DescriptionCellProps) {
  const current = row.descriptionEdited ?? row.descriptionOriginal;
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  function commit() {
    const next = value.trim();
    if (next === current.trim()) {
      setValue(current);
      return;
    }
    if (next === "" || next === row.descriptionOriginal) {
      setValue(row.descriptionOriginal);
      onChange(row.id, null);
      return;
    }
    onChange(row.id, next);
  }

  return (
    <div>
      <span className="cc-input" style={{ height: 40 }}>
        <input
          value={value}
          maxLength={120}
          disabled={disabled}
          aria-label={`Descrição de ${row.descriptionOriginal}`}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setValue(current);
              e.currentTarget.blur();
            }
          }}
          style={{ font: "600 14px/20px var(--font-sans)" }}
        />
      </span>
      {row.descriptionEdited && (
        <div className="caption cc-muted" style={{ marginTop: 2 }}>
          No extrato: {row.descriptionOriginal}
        </div>
      )}
    </div>
  );
}
