"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { inviteMember } from "@/app/(app)/familia/actions";

interface InviteCardProps {
  canManage: boolean;
  onInviteSuccess: (link: string) => void;
}

export function InviteCard({ canManage, onInviteSuccess }: InviteCardProps) {
  const [email, setEmail] = useState("");
  const [kinship, setKinship] = useState<"titular" | "conjuge" | "filho" | "outro">("conjuge");
  const [role, setRole] = useState<"admin" | "membro">("membro");
  const [participatesInSplit, setParticipatesInSplit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setError(null);
    startTransition(async () => {
      const res = await inviteMember({
        email,
        role,
        kinship,
        participatesInSplit,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setEmail("");
      setKinship("conjuge");
      setRole("membro");
      setParticipatesInSplit(true);
      onInviteSuccess(res.link);
    });
  };

  return (
    <form
      className="cc-card"
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      onSubmit={handleSubmit}
    >
      <h2 className="title">Convidar membro</h2>

      <label className="cc-field">
        <span className="cc-field__label">Email</span>
        <span className={`cc-input ${error ? "cc-input--error" : ""}`}>
          <input
            className="cc-input__text"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="nome@email.com"
            required
            disabled={!canManage || isPending}
          />
        </span>
        {error && <span className="cc-field__hint cc-field__hint--error">{error}</span>}
      </label>

      <label className="cc-field">
        <span className="cc-field__label">Parentesco</span>
        <select
          className="cc-select"
          style={{ height: "44px" }}
          value={kinship}
          onChange={(e) => setKinship(e.target.value as "titular" | "conjuge" | "filho" | "outro")}
          disabled={!canManage || isPending}
        >
          <option value="conjuge">Cônjuge</option>
          <option value="filho">Filho(a)</option>
          <option value="outro">Outro</option>
        </select>
      </label>

      <label className="cc-field">
        <span className="cc-field__label">Papel</span>
        <select
          className="cc-select"
          style={{ height: "44px" }}
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "membro")}
          disabled={!canManage || isPending}
        >
          <option value="membro">Membro</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label className="cc-check">
        <input
          type="checkbox"
          checked={participatesInSplit}
          onChange={(e) => setParticipatesInSplit(e.target.checked)}
          disabled={!canManage || isPending}
        />
        Participa da divisão das despesas da família
      </label>

      <Button
        type="submit"
        variant="primary"
        disabled={!canManage || isPending}
      >
        {isPending ? "Enviando convite..." : "Enviar convite"}
      </Button>

      <span className="caption cc-muted">
        O convite vale 7 dias. Sem email configurado, o app mostra um link para você mandar por
        WhatsApp.
      </span>
    </form>
  );
}
