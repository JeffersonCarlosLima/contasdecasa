"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { renameFamily } from "@/app/(app)/familia/actions";

interface RenameFamilyModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RenameFamilyModal({
  isOpen,
  currentName,
  onClose,
  onSuccess,
}: RenameFamilyModalProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome da família.");
      return;
    }

    startTransition(async () => {
      const res = await renameFamily({ name: name.trim() });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renomear família">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label className="cc-field">
          <span className="cc-field__label">Nome da família</span>
          <span className={`cc-input ${error ? "cc-input--error" : ""}`}>
            <input
              className="cc-input__text"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
              disabled={isPending}
            />
          </span>
          {error && <span className="cc-field__hint cc-field__hint--error">{error}</span>}
        </label>

        <div className="cc-formfoot">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
