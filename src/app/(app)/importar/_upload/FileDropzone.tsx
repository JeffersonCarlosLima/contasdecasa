"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { formatFileSize } from "./helpers";

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function FileDropzone({
  file,
  onFileSelect,
  error,
  disabled,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onFileSelect(selected);
  };

  const triggerInput = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className="cc-field cc-field--full">
      <span className="cc-field__label">Arquivo de extrato</span>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={handleChange}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Selecionar arquivo de extrato CSV"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerInput();
          }
        }}
        className="cc-card"
        style={{
          border: isDragOver
            ? "2px dashed var(--brand-ink)"
            : error
            ? "1px dashed var(--danger)"
            : "1px dashed var(--line)",
          background: isDragOver
            ? "var(--surface-sunken)"
            : file
            ? "var(--surface-sunken)"
            : "transparent",
          boxShadow: "none",
          padding: "var(--space-6) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, background-color 0.15s",
          textAlign: "center",
        }}
      >
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--brand-ink)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="label" style={{ fontWeight: 600 }}>
              {file.name}
            </span>
            <span className="caption cc-muted">{formatFileSize(file.size)}</span>
            <button
              type="button"
              className="cc-btn cc-btn--secondary"
              style={{ height: 32, padding: "0 12px", marginTop: 4, fontSize: 13 }}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                triggerInput();
              }}
            >
              Trocar arquivo
            </button>
          </div>
        ) : (
          <>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-muted)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="label" style={{ fontWeight: 500 }}>
              Arraste e solte o extrato CSV aqui ou clique para selecionar
            </span>
            <span className="caption cc-muted">
              Arquivo em formato .csv (máximo 5 MB e 5.000 linhas)
            </span>
          </>
        )}
      </div>

      {error && (
        <span role="alert" className="cc-field__hint cc-field__hint--error">
          {error}
        </span>
      )}
    </div>
  );
}
