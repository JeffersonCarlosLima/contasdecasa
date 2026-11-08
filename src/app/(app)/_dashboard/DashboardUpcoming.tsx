import Link from "next/link";
import { ExpenseRow } from "@/components/ui/ExpenseRow";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import type { BadgeStatus } from "@/components/ui/StatusBadge";
import type { ExpenseItem } from "@/lib/expense-queries";
import { getUpcomingMetaParts } from "./helpers";

interface DashboardUpcomingProps {
  upcoming: ExpenseItem[];
}

function mapStatusToBadge(status: ExpenseItem["status"]): BadgeStatus {
  if (status === "atrasado") return "late";
  if (status === "pendente") return "pending";
  return "paid";
}

export function DashboardUpcoming({ upcoming }: DashboardUpcomingProps) {
  const items = upcoming.slice(0, 5);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="cc-card__head" style={{ margin: 0 }}>
        <h2 className="title">Próximos vencimentos</h2>
        <Link
          className="cc-btn cc-btn--ghost cc-btn--sm"
          href="/despesas"
          style={{ textDecoration: "none" }}
        >
          Ver todas
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="caption cc-muted" style={{ padding: "12px 0" }}>
          Nenhum vencimento pendente este mês.
        </div>
      ) : (
        <div className="cc-list">
          {items.map((item) => {
            const isFamily = item.owner === null;
            const ownerName = isFamily ? "Família" : item.owner!.displayName;
            const ownerColor = isFamily ? "family" : ((item.owner!.color as PersonColor) || "person-a");
            const metaParts = getUpcomingMetaParts(item);

            const metaNode = (
              <>
                <MemberAvatar name={ownerName} color={ownerColor} />
                {ownerName}
                {metaParts.length > 0 && ` · ${metaParts.join(" · ")}`}
              </>
            );

            return (
              <ExpenseRow
                key={item.id}
                title={item.description}
                categoryColor={item.category.color}
                meta={metaNode}
                cents={item.amountCents}
                status={mapStatusToBadge(item.status)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
