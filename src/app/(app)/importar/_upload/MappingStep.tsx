"use client";

import { useId, useState } from "react";
import { SamplePreviewTable } from "./SamplePreviewTable";
import {
  guessAmountColumn,
  guessCreditColumn,
  guessDateColumn,
  guessDebitColumn,
  guessDescriptionColumn,
  guessIdentifierColumn,
} from "./helpers";
import type { MappingConfig } from "./types";

interface MappingStepProps {
  headers: string[];
  sample: string[][];
  onSubmit: (config: MappingConfig, name: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function MappingStep({
  headers,
  sample,
  onSubmit,
  onBack,
  isSubmitting,
  error,
}: MappingStepProps) {
  const nameId = useId();

  // Guesses for initial form state
  const initialDate = guessDateColumn(headers);
  const initialDesc = guessDescriptionColumn(headers);
  const initialAmount = guessAmountColumn(headers);
  const initialCredit = guessCreditColumn(headers);
  const initialDebit = guessDebitColumn(headers);
  const initialId = guessIdentifierColumn(headers);

  const [dateColumn, setDateColumn] = useState<string>(initialDate);
  const [dateFormat, setDateFormat] = useState<"dd/mm/yyyy" | "yyyy-mm-dd" | "dd/mm/yy">("dd/mm/yyyy");
  const [descriptionColumn, setDescriptionColumn] = useState<string>(initialDesc);

  const [valueMode, setValueMode] = useState<"unica" | "separadas">(
    initialAmount ? "unica" : initialCredit && initialDebit ? "separadas" : "unica"
  );
  const [amountColumn, setAmountColumn] = useState<string>(initialAmount ?? headers[0] ?? "");
  const [creditColumn, setCreditColumn] = useState<string>(initialCredit ?? "");
  const [debitColumn, setDebitColumn] = useState<string>(initialDebit ?? "");

  const [decimal, setDecimal] = useState<"," | ".">(",");
  const [separator, setSeparator] = useState<";" | "," | "\t">(";");
  const [externalIdColumn, setExternalIdColumn] = useState<string>(initialId ?? "");

  const [mappingName, setMappingName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!mappingName.trim()) {
      nextErrors.mappingName = "Informe um nome para identificar este modelo de extrato.";
    }
    if (!dateColumn) {
      nextErrors.dateColumn = "Selecione a coluna de data.";
    }
    if (!descriptionColumn) {
      nextErrors.descriptionColumn = "Selecione a coluna de descrição.";
    }
    if (valueMode === "unica" && !amountColumn) {
      nextErrors.amountColumn = "Selecione a coluna de valor.";
    }
    if (valueMode === "separadas") {
      if (!creditColumn) nextErrors.creditColumn = "Selecione a coluna de crédito/entradas.";
      if (!debitColumn) nextErrors.debitColumn = "Selecione a coluna de débito/saídas.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const config: MappingConfig = {
      separator,
      headerSignature: headers,
      dateColumn,
      dateFormat,
      descriptionColumns: [descriptionColumn],
      amountColumn: valueMode === "unica" ? amountColumn : undefined,
      creditColumn: valueMode === "separadas" ? creditColumn : undefined,
      debitColumn: valueMode === "separadas" ? debitColumn : undefined,
      externalIdColumn: externalIdColumn ? externalIdColumn : undefined,
      decimal,
    };

    onSubmit(config, mappingName.trim());
  };

  return (
    <form
      className="cc-card"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
      onSubmit={handleFormSubmit}
    >
      <div>
        <h2 className="title" style={{ margin: "0 0 4px 0" }}>
          Conferir colunas do extrato
        </h2>
        <span className="body cc-muted">
          Não identificamos o formato deste arquivo automaticamente. Indique as colunas correspondentes para prosseguir.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="cc-field__hint cc-field__hint--error"
          style={{
            fontSize: 14,
            padding: "12px 16px",
            backgroundColor: "var(--danger-subtle, #fde8e8)",
            borderRadius: "var(--radius-md, 8px)",
          }}
        >
          {error}
        </div>
      )}

      <SamplePreviewTable headers={headers} sample={sample} />

      <div className="cc-form">
        <label className="cc-field" htmlFor={nameId}>
          <span className="cc-field__label">Nome do modelo de extrato</span>
          <span className={`cc-input ${fieldErrors.mappingName ? "cc-input--error" : ""}`}>
            <input
              id={nameId}
              className="cc-input__text"
              type="text"
              value={mappingName}
              placeholder="Ex.: Extrato Banco X"
              disabled={isSubmitting}
              onChange={(e) => {
                setMappingName(e.target.value);
                if (fieldErrors.mappingName) {
                  setFieldErrors((prev) => ({ ...prev, mappingName: "" }));
                }
              }}
            />
          </span>
          {fieldErrors.mappingName && (
            <span role="alert" className="cc-field__hint cc-field__hint--error">
              {fieldErrors.mappingName}
            </span>
          )}
        </label>

        <label className="cc-field">
          <span className="cc-field__label">Separador de colunas</span>
          <select
            className="cc-select"
            style={{ height: 44 }}
            value={separator}
            disabled={isSubmitting}
            onChange={(e) => setSeparator(e.target.value as ";" | "," | "\t")}
          >
            <option value=";">Ponto e vírgula (;)</option>
            <option value=",">Vírgula (,)</option>
            <option value="&#9;">Tabulação (\t)</option>
          </select>
        </label>
      </div>

      <div className="cc-form">
        <label className="cc-field">
          <span className="cc-field__label">Coluna de Data</span>
          <select
            className={`cc-select ${fieldErrors.dateColumn ? "cc-input--error" : ""}`}
            style={{ height: 44 }}
            value={dateColumn}
            disabled={isSubmitting}
            onChange={(e) => {
              setDateColumn(e.target.value);
              if (fieldErrors.dateColumn) {
                setFieldErrors((prev) => ({ ...prev, dateColumn: "" }));
              }
            }}
          >
            <option value="">Selecione a coluna...</option>
            {headers.map((h, i) => (
              <option key={i} value={h}>
                {h}
              </option>
            ))}
          </select>
          {fieldErrors.dateColumn && (
            <span role="alert" className="cc-field__hint cc-field__hint--error">
              {fieldErrors.dateColumn}
            </span>
          )}
        </label>

        <label className="cc-field">
          <span className="cc-field__label">Formato de data</span>
          <select
            className="cc-select"
            style={{ height: 44 }}
            value={dateFormat}
            disabled={isSubmitting}
            onChange={(e) =>
              setDateFormat(e.target.value as "dd/mm/yyyy" | "yyyy-mm-dd" | "dd/mm/yy")
            }
          >
            <option value="dd/mm/yyyy">DD/MM/AAAA (ex.: 25/11/2026)</option>
            <option value="yyyy-mm-dd">AAAA-MM-DD (ex.: 2026-11-25)</option>
            <option value="dd/mm/yy">DD/MM/AA (ex.: 25/11/26)</option>
          </select>
        </label>

        <label className="cc-field cc-field--full">
          <span className="cc-field__label">Coluna de Descrição</span>
          <select
            className={`cc-select ${fieldErrors.descriptionColumn ? "cc-input--error" : ""}`}
            style={{ height: 44 }}
            value={descriptionColumn}
            disabled={isSubmitting}
            onChange={(e) => {
              setDescriptionColumn(e.target.value);
              if (fieldErrors.descriptionColumn) {
                setFieldErrors((prev) => ({ ...prev, descriptionColumn: "" }));
              }
            }}
          >
            <option value="">Selecione a coluna...</option>
            {headers.map((h, i) => (
              <option key={i} value={h}>
                {h}
              </option>
            ))}
          </select>
          {fieldErrors.descriptionColumn && (
            <span role="alert" className="cc-field__hint cc-field__hint--error">
              {fieldErrors.descriptionColumn}
            </span>
          )}
        </label>
      </div>

      {/* Value Configuration Block */}
      <div
        className="cc-card"
        style={{
          background: "var(--surface-sunken)",
          border: 0,
          boxShadow: "none",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span className="label">Formato dos valores</span>

        <div className="cc-seg" role="group" aria-label="Modo de valor">
          <button
            type="button"
            aria-pressed={valueMode === "unica"}
            disabled={isSubmitting}
            onClick={() => setValueMode("unica")}
          >
            Coluna única de valor
          </button>
          <button
            type="button"
            aria-pressed={valueMode === "separadas"}
            disabled={isSubmitting}
            onClick={() => setValueMode("separadas")}
          >
            Colunas separadas (Crédito e Débito)
          </button>
        </div>

        {valueMode === "unica" ? (
          <div className="cc-form">
            <label className="cc-field">
              <span className="cc-field__label">Coluna de Valor</span>
              <select
                className={`cc-select ${fieldErrors.amountColumn ? "cc-input--error" : ""}`}
                style={{ height: 44 }}
                value={amountColumn}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAmountColumn(e.target.value);
                  if (fieldErrors.amountColumn) {
                    setFieldErrors((prev) => ({ ...prev, amountColumn: "" }));
                  }
                }}
              >
                <option value="">Selecione a coluna...</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {fieldErrors.amountColumn && (
                <span role="alert" className="cc-field__hint cc-field__hint--error">
                  {fieldErrors.amountColumn}
                </span>
              )}
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Separador decimal</span>
              <select
                className="cc-select"
                style={{ height: 44 }}
                value={decimal}
                disabled={isSubmitting}
                onChange={(e) => setDecimal(e.target.value as "," | ".")}
              >
                <option value=",">Vírgula (ex.: 1.234,56)</option>
                <option value=".">Ponto (ex.: 1234.56)</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="cc-form">
            <label className="cc-field">
              <span className="cc-field__label">Coluna de Crédito (Entradas)</span>
              <select
                className={`cc-select ${fieldErrors.creditColumn ? "cc-input--error" : ""}`}
                style={{ height: 44 }}
                value={creditColumn}
                disabled={isSubmitting}
                onChange={(e) => {
                  setCreditColumn(e.target.value);
                  if (fieldErrors.creditColumn) {
                    setFieldErrors((prev) => ({ ...prev, creditColumn: "" }));
                  }
                }}
              >
                <option value="">Selecione a coluna...</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {fieldErrors.creditColumn && (
                <span role="alert" className="cc-field__hint cc-field__hint--error">
                  {fieldErrors.creditColumn}
                </span>
              )}
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Coluna de Débito (Saídas)</span>
              <select
                className={`cc-select ${fieldErrors.debitColumn ? "cc-input--error" : ""}`}
                style={{ height: 44 }}
                value={debitColumn}
                disabled={isSubmitting}
                onChange={(e) => {
                  setDebitColumn(e.target.value);
                  if (fieldErrors.debitColumn) {
                    setFieldErrors((prev) => ({ ...prev, debitColumn: "" }));
                  }
                }}
              >
                <option value="">Selecione a coluna...</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {fieldErrors.debitColumn && (
                <span role="alert" className="cc-field__hint cc-field__hint--error">
                  {fieldErrors.debitColumn}
                </span>
              )}
            </label>

            <label className="cc-field">
              <span className="cc-field__label">Separador decimal</span>
              <select
                className="cc-select"
                style={{ height: 44 }}
                value={decimal}
                disabled={isSubmitting}
                onChange={(e) => setDecimal(e.target.value as "," | ".")}
              >
                <option value=",">Vírgula (ex.: 1.234,56)</option>
                <option value=".">Ponto (ex.: 1234.56)</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="cc-form">
        <label className="cc-field cc-field--full">
          <span className="cc-field__label">Identificador / Documento (opcional)</span>
          <select
            className="cc-select"
            style={{ height: 44 }}
            value={externalIdColumn}
            disabled={isSubmitting}
            onChange={(e) => setExternalIdColumn(e.target.value)}
          >
            <option value="">(Nenhum)</option>
            {headers.map((h, i) => (
              <option key={i} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span className="cc-field__hint">
            Ajuda a evitar duplicidades caso o banco forneça número de documento ou transação.
          </span>
        </label>
      </div>

      <div className="cc-formfoot cc-actions--wide">
        <button
          type="button"
          className="cc-btn cc-btn--secondary"
          disabled={isSubmitting}
          onClick={onBack}
        >
          Voltar
        </button>

        <button
          type="submit"
          className="cc-btn cc-btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando e importando…" : "Salvar modelo e continuar"}
        </button>
      </div>
    </form>
  );
}
