"use client";

import { useRouter } from "next/navigation";
import { ExpenseRow } from "@/components/ui/ExpenseRow";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { shortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { ExpenseRowAction } from "./ExpenseRowAction";
import type { ExpenseGroup, ExpenseItem, ViewMode } from "./types";

export interface ExpenseMobileListProps {
  mode: ViewMode;
  items: ExpenseItem[];
  groups: ExpenseGroup[];
  closed?: boolean;
}

export function ExpenseMobileList({
  mode,
  items,
  groups,
  closed = false,
}: ExpenseMobileListProps) {
  const router = useRouter();

  function handleRowClick(e: React.MouseEvent, id: string) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    router.push(`/despesas/${id}`);
  }

  function handleRowKeyDown(e: React.KeyboardEvent, id: string) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/despesas/${id}`);
    }
  }

  function renderMeta(item: ExpenseItem, showOwner = false) {
    const installmentText = item.installment
      ? `${item.installment.current} de ${item.installment.total}`
      : item.recurring
      ? "recorrente"
      : null;

    const parts: string[] = [];

    if (showOwner) {
      parts.push(item.owner ? item.owner.displayName : "Família");
    }

    if (item.status === "pago") {
      const payer = item.paidBy?.displayName ?? "alguém";
      const dateStr = item.paidAt ? shortDate(String(item.paidAt)) : "";
      parts.push(`pago por ${payer}${dateStr ? ` · ${dateStr}` : ""}`);
    } else if (item.status === "atrasado") {
      parts.push(`venceu ${shortDate(item.dueDate)}`);
      if (installmentText) parts.push(installmentText);
      else parts.push(item.category.name);
    } else {
      parts.push(`vence ${shortDate(item.dueDate)}`);
      if (installmentText) parts.push(installmentText);
      else parts.push(item.category.name);
    }

    if (item.notes) {
      parts.push(item.notes);
    }

    return parts.join(" · ");
  }

  if (mode === "data") {
    return (
      <div className="cc-list cc-only-sm">
        {items.length === 0 ? (
          <div
            style={{ padding: "var(--space-4)", textAlign: "center" }}
            className="body cc-muted"
          >
            Nenhuma despesa encontrada.
          </div>
        ) : (
          items.map((item) => {
            const badgeStatus =
              item.status === "pago"
                ? "paid"
                : item.status === "atrasado"
                ? "late"
                : "pending";

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={(e) => handleRowClick(e, item.id)}
                onKeyDown={(e) => handleRowKeyDown(e, item.id)}
                style={{ cursor: "pointer" }}
                aria-label={`Ver detalhes da despesa ${item.description}`}
              >
                <ExpenseRow
                  title={item.description}
                  categoryColor={item.category.color}
                  cents={item.amountCents}
                  status={badgeStatus}
                  meta={renderMeta(item, true)}
                  action={
                    <ExpenseRowAction
                      id={item.id}
                      isPaid={item.status === "pago"}
                      disabled={closed}
                    />
                  }
                />
              </div>
            );
          })
        )}
      </div>
    );
  }

  // mode === "pessoa"
  return (
    <div className="cc-list cc-only-sm">
      {groups.map((group, idx) => {
        const isFamily = group.owner === null;
        const ownerName = group.owner?.displayName ?? "Família";
        const hasExpenses = group.items.length > 0;

        return (
          <div key={group.owner?.id ?? "family"}>
            <div
              className="cc-group__head"
              style={idx > 0 ? { borderTop: "1px solid var(--line)" } : {}}
            >
              <span className="cc-group__who">
                {isFamily ? (
                  <MemberAvatar color="family" name="Família" size="md" />
                ) : (
                  <MemberAvatar
                    name={group.owner!.displayName}
                    color={group.owner!.color as PersonColor}
                    size="md"
                  />
                )}
                {ownerName}
              </span>
              <span className="cc-group__sum">
                {!hasExpenses ? (
                  "Sem despesas"
                ) : (
                  <>
                    <b>{formatBRL(group.subtotalCents)}</b>
                    {group.paidCents > 0 && (
                      <> · pago {formatBRL(group.paidCents)}</>
                    )}
                  </>
                )}
              </span>
            </div>

            {group.items.map((item) => {
              const badgeStatus =
                item.status === "pago"
                  ? "paid"
                  : item.status === "atrasado"
                  ? "late"
                  : "pending";

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleRowClick(e, item.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, item.id)}
                  style={{ cursor: "pointer" }}
                  aria-label={`Ver detalhes da despesa ${item.description}`}
                >
                  <ExpenseRow
                    title={item.description}
                    categoryColor={item.category.color}
                    cents={item.amountCents}
                    status={badgeStatus}
                    meta={renderMeta(item, false)}
                    action={
                      <ExpenseRowAction
                        id={item.id}
                        isPaid={item.status === "pago"}
                        disabled={closed}
                      />
                    }
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
