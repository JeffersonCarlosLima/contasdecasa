"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { addDependent } from "@/app/(app)/familia/actions";

interface AddDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDependentModal({ isOpen, onClose, onSuccess }: AddDependentModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [kinship, setKinship] = useState<"titular" | "conjuge" | "filho" | "outro">("filho");
  const [participatesInSplit, setParticipatesInSplit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError("Informe o nome do dependente.");
      return;
    }

    startTransition(async () => {
      const res = await addDependent({
        displayName: displayName.trim(),
        kinship,
        participatesInSplit,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setDisplayName("");
      setKinship("filho");
      setParticipatesInSplit(false);
      onSuccess();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar dependente">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p className="body cc-muted" style={{ margin: 0 }}>
          Cadastre filhos ou pessoas da casa que não terão login no app. As despesas lançadas por você
          ou por outros administradores poderão ser associadas a este dependente.
        </p>

        <label className="cc-field">
          <span className="cc-field__label">Nome de exibição</span>
          <span className={`cc-input ${error ? "cc-input--error" : ""}`}>
            <input
              className="cc-input__text"
              type="text"
              placeholder="Ex.: Lucas ou Bebê"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError(null);
              }}
              required
              disabled={isPending}
            />
          </span>
          {error && (
            <span className="cc-field__hint cc-field__hint--error" role="alert">
              {error}
            </span>
          )}
        </label>

        <label className="cc-field">
          <span className="cc-field__label">Parentesco</span>
          <select
            className="cc-select"
            style={{ height: "44px" }}
            value={kinship}
            onChange={(e) => setKinship(e.target.value as "titular" | "conjuge" | "filho" | "outro")}
            disabled={isPending}
          >
            <option value="filho">Filho(a)</option>
            <option value="conjuge">Cônjuge</option>
            <option value="outro">Outro parente</option>
            <option value="titular">Titular</option>
          </select>
        </label>

        <label className="cc-check">
          <input
            type="checkbox"
            checked={participatesInSplit}
            onChange={(e) => setParticipatesInSplit(e.target.checked)}
            disabled={isPending}
          />
          Participa da divisão das despesas da família
        </label>

        <div className="cc-formfoot">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Salvando..." : "Adicionar dependente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
