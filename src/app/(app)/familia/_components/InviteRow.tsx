import { Button } from "@/components/ui/Button";
import { formatInviteMeta } from "./helpers";
import { KINSHIP_LABELS, type FamilyInviteItem } from "./types";

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
  const kinshipLabel = KINSHIP_LABELS[invite.kinship] ?? "Outro parente";
  const metaText = formatInviteMeta({
    kinship: invite.kinship,
    role: invite.role,
    expiresAt: invite.expiresAt,
  });

  const displayName = invite.email || `Convite pendente · ${kinshipLabel}`;
  const inviteTargetLabel = invite.email ?? `convite (${kinshipLabel})`;

  return (
    <div className="cc-member">
      <span className="cc-avatar cc-avatar--d" aria-hidden="true">
        ?
      </span>
      <div className="cc-member__main">
        <span className="cc-member__name">
          {displayName}{" "}
          {invite.email && (
            <span className="cc-role cc-role--invited">Convite pendente</span>
          )}
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
              aria-label={`Gerenciar ${inviteTargetLabel}`}
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
            aria-label={`Reenviar ${inviteTargetLabel}`}
          >
            {isResending ? "Enviando..." : "Reenviar"}
          </Button>
        </div>
      )}
    </div>
  );
}
