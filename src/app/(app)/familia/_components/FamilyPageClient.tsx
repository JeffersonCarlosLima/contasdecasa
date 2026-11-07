"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FamilyHeader } from "./FamilyHeader";
import { MemberList } from "./MemberList";
import { RoleTable } from "./RoleTable";
import { InviteCard } from "./InviteCard";
import { DependentCard } from "./DependentCard";
import { AddDependentModal } from "./AddDependentModal";
import { EditMemberModal } from "./EditMemberModal";
import { InviteLinkModal } from "./InviteLinkModal";
import { ManageInviteModal } from "./ManageInviteModal";
import { RenameFamilyModal } from "./RenameFamilyModal";
import { resendInvite } from "@/app/(app)/familia/actions";
import type { FamilyMemberItem, FamilyInviteItem } from "./types";
import type { MemberRole } from "@/lib/session";

interface FamilyPageClientProps {
  initialFamilyName: string;
  initialMembers: FamilyMemberItem[];
  initialInvites: FamilyInviteItem[];
  currentUserRole: MemberRole;
  currentMemberId: string;
  isSplitPersonalizada?: boolean;
}

export function FamilyPageClient({
  initialFamilyName,
  initialMembers,
  initialInvites,
  currentUserRole,
  currentMemberId,
  isSplitPersonalizada = false,
}: FamilyPageClientProps) {
  const router = useRouter();

  const [editingMember, setEditingMember] = useState<FamilyMemberItem | null>(null);
  const [managingInvite, setManagingInvite] = useState<FamilyInviteItem | null>(null);
  const [isAddDependentOpen, setIsAddDependentOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const canManage = currentUserRole === "dono" || currentUserRole === "admin";

  const activeMembers = initialMembers.filter((m) => m.status === "ativo");

  const handleDirectResend = async (invite: FamilyInviteItem) => {
    if (!canManage) return;
    setResendingInviteId(invite.id);
    try {
      const res = await resendInvite(invite.id);
      if (res.ok) {
        setGeneratedLink(res.link);
        router.refresh();
      } else {
        alert(res.error);
      }
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="cc-wrap">
      <FamilyHeader
        familyName={initialFamilyName}
        memberCount={activeMembers.length}
        pendingInviteCount={initialInvites.length}
        canManage={canManage}
        onRenameClick={() => setIsRenameOpen(true)}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        <section
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <MemberList
            members={initialMembers}
            invites={initialInvites}
            canManage={canManage}
            resendingInviteId={resendingInviteId}
            onEditMember={(member) => setEditingMember(member)}
            onResendInvite={handleDirectResend}
            onManageInvite={(invite) => setManagingInvite(invite)}
          />

          <RoleTable />
        </section>

        <aside
          style={{
            flex: "1 1 320px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <InviteCard
            canManage={canManage}
            onInviteSuccess={(link) => {
              setGeneratedLink(link);
              handleRefresh();
            }}
          />

          <DependentCard
            canManage={canManage}
            onAddClick={() => setIsAddDependentOpen(true)}
          />

          <a
            className="cc-btn cc-btn--secondary cc-only-sm"
            href="/tipos"
            style={{ textDecoration: "none" }}
          >
            Tipos e formas
          </a>
        </aside>
      </div>

      {/* Modais */}
      <AddDependentModal
        isOpen={isAddDependentOpen}
        onClose={() => setIsAddDependentOpen(false)}
        onSuccess={handleRefresh}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        member={editingMember}
        currentUserRole={currentUserRole}
        currentMemberId={currentMemberId}
        isSplitPersonalizada={isSplitPersonalizada}
        onClose={() => setEditingMember(null)}
        onSuccess={handleRefresh}
      />

      <ManageInviteModal
        isOpen={!!managingInvite}
        invite={managingInvite}
        onClose={() => setManagingInvite(null)}
        onSuccess={(newLink) => {
          if (newLink) {
            setGeneratedLink(newLink);
          }
          handleRefresh();
        }}
      />

      {generatedLink && (
        <InviteLinkModal
          isOpen={!!generatedLink}
          link={generatedLink}
          familyName={initialFamilyName}
          onClose={() => setGeneratedLink(null)}
        />
      )}

      <RenameFamilyModal
        isOpen={isRenameOpen}
        currentName={initialFamilyName}
        onClose={() => setIsRenameOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
