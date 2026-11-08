import { Button } from "@/components/ui/Button";
import { getPluralizedSupportText } from "./helpers";

interface FamilyHeaderProps {
  familyName: string;
  memberCount: number;
  pendingInviteCount: number;
  canManage: boolean;
  onRenameClick?: () => void;
}

export function FamilyHeader({
  familyName,
  memberCount,
  pendingInviteCount,
  canManage,
  onRenameClick,
}: FamilyHeaderProps) {
  const supportText = getPluralizedSupportText(memberCount, pendingInviteCount);

  return (
    <div className="cc-top">
      <div className="cc-top__titles">
        <span className="label cc-muted">Sua família</span>
        <h1 className="heading">{familyName}</h1>
        <span className="body cc-muted">{supportText}</span>
      </div>
      {canManage && (
        <Button
          type="button"
          variant="secondary"
          onClick={onRenameClick}
          aria-label="Renomear família"
        >
          Renomear família
        </Button>
      )}
    </div>
  );
}
