import { MemberRow } from "./MemberRow";
import { InviteRow } from "./InviteRow";
import type { FamilyMemberItem, FamilyInviteItem } from "./types";

interface MemberListProps {
  members: FamilyMemberItem[];
  invites: FamilyInviteItem[];
  canManage: boolean;
  resendingInviteId?: string | null;
  onEditMember: (member: FamilyMemberItem) => void;
  onResendInvite: (invite: FamilyInviteItem) => void;
  onManageInvite?: (invite: FamilyInviteItem) => void;
}

export function MemberList({
  members,
  invites,
  canManage,
  resendingInviteId,
  onEditMember,
  onResendInvite,
  onManageInvite,
}: MemberListProps) {
  const hasItems = members.length > 0 || invites.length > 0;

  return (
    <section
      style={{
        flex: "999 1 520px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
      aria-labelledby="members-heading"
    >
      <h2 id="members-heading" className="title">
        Membros
      </h2>
      <div className="cc-list">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            canManage={canManage}
            onEdit={onEditMember}
          />
        ))}
        {invites.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            canManage={canManage}
            isResending={resendingInviteId === invite.id}
            onResend={onResendInvite}
            onManage={onManageInvite}
          />
        ))}
        {!hasItems && (
          <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
            <span className="body cc-muted">Nenhum membro cadastrado nesta família.</span>
          </div>
        )}
      </div>
    </section>
  );
}
