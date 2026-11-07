import { Button } from "@/components/ui/Button";
import { formatInviteMeta } from "./helpers";
import type { FamilyInviteItem } from "./types";

interface InviteRowProps {
  invite: FamilyInviteItem;
  canManage: boolean;
  isResending?: boolean;
  onResend: (invite: FamilyInviteItem) => void;
  onManage?: (invite: FamilyInviteItem) => void;
}

export function InviteRow({
  invite,
  canManage,
  isResending,
  onResend,
  onManage,
}: InviteRowProps) {
  const metaText = formatInviteMeta({
    kinship: invite.kinship,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });

  return (
    <div className="cc-member">
      <span className="cc-avatar cc-avatar--d" aria-hidden="true">
        ?
      </span>
      <div className="cc-member__main">
        <span className="cc-member__name">
          {invite.email}{" "}
          <span className="cc-role cc-role--invited">Convite pendente</span>
        </span>
        <span className="cc-member__meta">{metaText}</span>
      </div>
      {canManage && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {onManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onManage(invite)}
              aria-label={`Gerenciar convite de ${invite.email}`}
            >
              Opções
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onResend(invite)}
            disabled={isResending}
            aria-label={`Reenviar convite para ${invite.email}`}
          >
            {isResending ? "Enviando..." : "Reenviar"}
          </Button>
        </div>
      )}
    </div>
  );
}
