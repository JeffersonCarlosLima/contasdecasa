"use client";

import { useRouter } from "next/navigation";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { monthLabel, shortDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { ExpenseRowAction } from "./ExpenseRowAction";
import type { ExpenseGroup, ExpenseItem, ViewMode } from "./types";

export interface ExpenseTableProps {
  mode: ViewMode;
  items: ExpenseItem[];
  groups: ExpenseGroup[];
  month: string;
  closed?: boolean;
  splitDescription?: string;
}

export function ExpenseTable({
  mode,
  items,
  groups,
  month,
  closed = false,
  splitDescription,
}: ExpenseTableProps) {
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

  const monthName = monthLabel(month).split(" ")[0]?.toLowerCase() ?? month;

  if (mode === "data") {
    return (
      <div className="cc-tablebox cc-hide-sm">
        {items.length === 0 ? (
          <div
            style={{ padding: "var(--space-5)", textAlign: "center" }}
            className="body cc-muted"
          >
            Nenhuma despesa encontrada.
          </div>
        ) : (
          <table className="cc-table">
            <thead>
              <tr>
                <th>Dono</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th>Parcela</th>
                <th>Lançado por</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const badgeStatus =
                  item.status === "pago"
                    ? "paid"
                    : item.status === "atrasado"
                    ? "late"
                    : "pending";

                const installmentText = item.installment
                  ? `${item.installment.current} de ${item.installment.total}`
                  : item.recurring
                  ? "Recorrente"
                  : "—";

                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    onClick={(e) => handleRowClick(e, item.id)}
                    onKeyDown={(e) => handleRowKeyDown(e, item.id)}
                    style={{ cursor: "pointer" }}
                    aria-label={`Ver detalhes da despesa ${item.description}`}
                  >
                    <td>
                      {item.owner ? (
                        <MemberAvatar
                          name={item.owner.displayName}
                          color={item.owner.color as PersonColor}
                          size="md"
                        />
                      ) : (
                        <MemberAvatar
                          color="family"
                          name="Família"
                          size="md"
                        />
                      )}
                    </td>
                    <td>
                      <b>{item.description}</b>
                      {item.notes ? (
                        <div className="caption cc-muted">{item.notes}</div>
                      ) : item.paidAt ? (
                        <div className="caption cc-muted">
                          Pago por {item.paidBy?.displayName ?? "alguém"} em{" "}
                          {shortDate(String(item.paidAt))}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className="cc-cat__name">
                        <span
                          className="cc-chip__dot"
                          style={{
                            background: `var(--${item.category.color})`,
                          }}
                        />
                        {item.category.name}
                      </span>
                    </td>
                    <td>{shortDate(item.dueDate)}</td>
                    <td
                      className={
                        installmentText === "—" ? "cc-muted" : undefined
                      }
                    >
                      {installmentText}
                    </td>
                    <td>
                      {item.paidBy?.displayName ??
                        item.owner?.displayName ??
                        "Família"}
                    </td>
                    <td className="num">{formatBRL(item.amountCents)}</td>
                    <td>
                      <StatusBadge status={badgeStatus} />
                    </td>
                    <td>
                      <ExpenseRowAction
                        id={item.id}
                        isPaid={item.status === "pago"}
                        disabled={closed}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // mode === "pessoa"
  return (
    <div className="cc-tablebox cc-hide-sm">
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
                  <MemberAvatar color="family" name="Família" size="lg" />
                ) : (
                  <MemberAvatar
                    name={group.owner!.displayName}
                    color={group.owner!.color as PersonColor}
                    size="lg"
                  />
                )}
                {ownerName}
                {isFamily && splitDescription && (
                  <span
                    className="caption cc-muted"
                    style={{ fontWeight: 400 }}
                  >
                    {splitDescription}
                  </span>
                )}
              </span>

              <span className="cc-group__sum">
                {!hasExpenses ? (
                  `Nenhuma despesa em ${monthName}`
                ) : (
                  <>
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "despesa" : "despesas"} ·{" "}
                    <b>{formatBRL(group.subtotalCents)}</b> · pago{" "}
                    {formatBRL(group.paidCents)} · pendente{" "}
                    {formatBRL(group.pendingCents)}
                  </>
                )}
              </span>
            </div>

            {hasExpenses && (
              <table className="cc-table">
                {idx === 0 && (
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th>Vencimento</th>
                      <th>Parcela</th>
                      <th>Lançado por</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {group.items.map((item) => {
                    const badgeStatus =
                      item.status === "pago"
                        ? "paid"
                        : item.status === "atrasado"
                        ? "late"
                        : "pending";

                    const installmentText = item.installment
                      ? `${item.installment.current} de ${item.installment.total}`
                      : item.recurring
                      ? "Recorrente"
                      : "—";

                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        onClick={(e) => handleRowClick(e, item.id)}
                        onKeyDown={(e) => handleRowKeyDown(e, item.id)}
                        style={{ cursor: "pointer" }}
                        aria-label={`Ver detalhes da despesa ${item.description}`}
                      >
                        <td>
                          <b>{item.description}</b>
                          {item.notes ? (
                            <div className="caption cc-muted">{item.notes}</div>
                          ) : item.paidAt ? (
                            <div className="caption cc-muted">
                              Pago por {item.paidBy?.displayName ?? "alguém"} em{" "}
                              {shortDate(String(item.paidAt))}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <span className="cc-cat__name">
                            <span
                              className="cc-chip__dot"
                              style={{
                                background: `var(--${item.category.color})`,
                              }}
                            />
                            {item.category.name}
                          </span>
                        </td>
                        <td>{shortDate(item.dueDate)}</td>
                        <td
                          className={
                            installmentText === "—" ? "cc-muted" : undefined
                          }
                        >
                          {installmentText}
                        </td>
                        <td>
                          {item.paidBy?.displayName ??
                            item.owner?.displayName ??
                            "Família"}
                        </td>
                        <td className="num">{formatBRL(item.amountCents)}</td>
                        <td>
                          <StatusBadge status={badgeStatus} />
                        </td>
                        <td>
                          <ExpenseRowAction
                            id={item.id}
                            isPaid={item.status === "pago"}
                            disabled={closed}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
