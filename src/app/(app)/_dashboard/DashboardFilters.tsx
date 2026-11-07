import Link from "next/link";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import type { DashboardMember } from "./types";

interface DashboardFiltersProps {
  month: string;
  members: DashboardMember[];
  selectedMemberId?: string | null;
}

export function DashboardFilters({ month, members, selectedMemberId }: DashboardFiltersProps) {
  const isAll = !selectedMemberId;

  return (
    <div className="cc-filters" role="group" aria-label="Ver dados de">
      <Link
        href={`/?mes=${month}`}
        className="cc-chip"
        aria-pressed={isAll}
      >
        <span className="cc-avatars">
          {members.map((m) => (
            <MemberAvatar key={m.id} name={m.displayName} color={m.color as PersonColor} />
          ))}
        </span>
        Família toda
      </Link>

      {members.map((m) => {
        const isSelected = selectedMemberId === m.id;
        return (
          <Link
            key={m.id}
            href={`/?mes=${month}&membro=${encodeURIComponent(m.id)}`}
            className="cc-chip"
            aria-pressed={isSelected}
          >
            <MemberAvatar name={m.displayName} color={m.color as PersonColor} />
            {m.displayName}
          </Link>
        );
      })}
    </div>
  );
}
