"use client";

import { useState, useTransition } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { TIMEZONE } from "@/lib/dates";
import { cancelInvite, resendInvite } from "@/app/(app)/familia/actions";
import { KINSHIP_LABELS, ROLE_LABELS, type FamilyInviteItem } from "./types";

interface ManageInviteModalProps {
  isOpen: boolean;
  invite: FamilyInviteItem | null;
  onClose: () => void;
  onSuccess: (newLink?: string) => void;
}

export function ManageInviteModal({
  isOpen,
  invite,
  onClose,
  onSuccess,
}: ManageInviteModalProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!invite) return null;

  const kinship = KINSHIP_LABELS[invite.kinship] ?? "Outro parente";
  const roleName = ROLE_LABELS[invite.role] ?? "Membro";

  const expiresFormatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(invite.expiresAt));

  const handleResend = () => {
    setError(null);
    startTransition(async () => {
      const res = await resendInvite(invite.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess(res.link);
      onClose();
    });
  };

  const handleCancelInvite = () => {
    setError(null);
    startTransition(async () => {
      const res = await cancelInvite(invite.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess();
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar convite pendente">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <span className="label cc-muted">Destinatário</span>
          <div className="title" style={{ fontSize: "16px", marginTop: "4px" }}>
            {invite.email}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <span className="label cc-muted">Papel</span>
            <div className="body" style={{ marginTop: "2px" }}>
              {roleName}
            </div>
          </div>
          <div>
            <span className="label cc-muted">Parentesco</span>
            <div className="body" style={{ marginTop: "2px" }}>
              {kinship}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span className="label cc-muted">Expiração</span>
            <div className="body" style={{ marginTop: "2px" }}>
              {expiresFormatted}
            </div>
          </div>
        </div>

        {error && <span className="cc-field__hint cc-field__hint--error">{error}</span>}

        {confirmCancel ? (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--danger-soft)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span className="body" style={{ color: "var(--danger)", fontSize: "14px" }}>
              Tem certeza que deseja cancelar este convite? O link enviado deixará de funcionar
              imediatamente.
            </span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmCancel(false)}
                disabled={isPending}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleCancelInvite}
                disabled={isPending}
              >
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="cc-formfoot" style={{ justifyContent: "space-between" }}>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              disabled={isPending}
            >
              Cancelar convite
            </Button>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                Fechar
              </Button>
              <Button type="button" variant="primary" onClick={handleResend} disabled={isPending}>
                {isPending ? "Reenviando..." : "Reenviar convite"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
