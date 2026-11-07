import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { Button } from "@/components/ui/Button";
import { formatMemberMeta, getMemberRoleLabel } from "./helpers";
import type { FamilyMemberItem } from "./types";

interface MemberRowProps {
  member: FamilyMemberItem;
  canManage: boolean;
  onEdit: (member: FamilyMemberItem) => void;
}

export function MemberRow({ member, canManage, onEdit }: MemberRowProps) {
  const isDependent = !member.userId;
  const { label: roleLabel, badgeClass } = getMemberRoleLabel(member.role, isDependent);

  const metaText = formatMemberMeta({
    isDependent,
    kinship: member.kinship,
    email: member.email,
    participatesInSplit: member.participatesInSplit,
  });

  return (
    <div className="cc-member">
      <MemberAvatar
        name={member.displayName}
        color={member.color as PersonColor}
        size="md"
      />
      <div className="cc-member__main">
        <span className="cc-member__name">
          {member.displayName}{" "}
          <span className={badgeClass}>{roleLabel}</span>
        </span>
        <span className="cc-member__meta">{metaText}</span>
      </div>
      {canManage && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(member)}
          aria-label={`Editar membro ${member.displayName}`}
        >
          Editar
        </Button>
      )}
    </div>
  );
}
