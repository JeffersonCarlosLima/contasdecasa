"use client";

import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/money";
import { formatSettlementCaption, getMonthName } from "./helpers";
import type { MonthMemberItem } from "./types";
import type { MonthSummary, SplitResult } from "@/lib/calc";

interface SummaryAsideProps {
  month: string;
  previousMonthLabel: string;
  summary: MonthSummary;
  split: SplitResult;
  members: MonthMemberItem[];
  recurring: {
    copied: boolean;
    names: string[];
  };
  closed: boolean;
  canManage: boolean;
  isSaving?: boolean;
  isCopyingRecurring?: boolean;
  onSave: () => void;
  onCopyRecurring: () => void;
  onToggleClose: () => void;
}

export function SummaryAside({
  month,
  previousMonthLabel,
  summary,
  split,
  members,
  recurring,
  closed,
  canManage,
  isSaving,
  isCopyingRecurring,
  onSave,
  onCopyRecurring,
  onToggleClose,
}: SummaryAsideProps) {
  const monthName = getMonthName(month);
  const isPositiveSobra = summary.leftoverCents >= 0;

  // Mapa de responsabilidade por membro do SplitResult
  const splitMemberMap = new Map<string, { responsibilityCents: number; paidCents: number }>();
  split.members.forEach((m) => {
    splitMemberMap.set(m.memberId, {
      responsibilityCents: m.responsibilityCents,
      paidCents: m.paidCents,
    });
  });

  const settlementMembers = members.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    paidCents: splitMemberMap.get(m.id)?.paidCents ?? 0,
  }));

  const settlementCaption = formatSettlementCaption({
    members: settlementMembers,
    settlements: split.settlements,
  });

  const recurringNamesText =
    recurring.names.length > 0
      ? `${recurring.names.join(", ")} já foram copiados para ${monthName}.`
      : `As despesas fixas já foram copiadas para ${monthName}.`;

  return (
    <aside
      className="cc-card"
      style={{
        flex: "1 1 300px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <h2 className="title">Resumo</h2>

      {/* Renda total */}
      <div className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="body">Renda total</span>
        <span className="cc-cat__val">{formatBRL(summary.incomeCents)}</span>
      </div>

      {/* Investimento */}
      <div className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="body">− Investimento</span>
        <span className="cc-cat__val" style={{ color: "var(--invest)" }}>
          {formatBRL(summary.investmentCents)}
        </span>
      </div>

      <div style={{ height: "1px", background: "var(--line)" }} />

      {/* Disponível para despesas */}
      <div className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="body" style={{ fontWeight: 600 }}>
          Disponível para despesas
        </span>
        <span className="cc-cat__val">{formatBRL(summary.availableCents)}</span>
      </div>

      {/* Despesas lançadas */}
      <div className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="body">− Despesas lançadas</span>
        <span className="cc-cat__val">{formatBRL(summary.spentCents)}</span>
      </div>

      <div style={{ height: "1px", background: "var(--line)" }} />

      {/* Sobra */}
      <div className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
        <span className="title">Sobra</span>
        <span
          className="cc-kpi__value"
          style={{
            fontSize: "24px",
            lineHeight: "30px",
            color: isPositiveSobra ? "var(--invest)" : "var(--danger)",
          }}
        >
          {formatBRL(summary.leftoverCents)}
        </span>
      </div>

      <div style={{ height: "1px", background: "var(--line)" }} />

      {/* Acerto entre vocês */}
      <span className="label cc-muted">Acerto entre vocês</span>
      {members
        .filter((m) => m.participatesInSplit || (splitMemberMap.get(m.id)?.responsibilityCents ?? 0) > 0)
        .map((member) => {
          const resp = splitMemberMap.get(member.id)?.responsibilityCents ?? 0;
          return (
            <div key={member.id} className="cc-cat" style={{ gridTemplateColumns: "1fr auto" }}>
              <span className="cc-split__name" style={{ fontWeight: 500 }}>
                <MemberAvatar
                  name={member.displayName}
                  color={(member.color as PersonColor) || "person-a"}
                />
                {member.displayName}
              </span>
              <span className="cc-cat__val">{formatBRL(resp)}</span>
            </div>
          );
        })}

      <span className="caption cc-muted">{settlementCaption}</span>

      {/* Card Recorrentes */}
      <div
        className="cc-card"
        style={{
          background: "var(--surface-sunken)",
          border: 0,
          boxShadow: "none",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span className="label">Recorrentes de {previousMonthLabel}</span>
        {recurring.copied ? (
          <span className="caption cc-muted">{recurringNamesText}</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span className="caption cc-muted">
              Copiar aluguel, internet e outras despesas fixas de {previousMonthLabel} para {monthName}.
            </span>
            {canManage && !closed && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onCopyRecurring}
                disabled={isCopyingRecurring}
                style={{ alignSelf: "flex-start" }}
              >
                {isCopyingRecurring ? "Copiando..." : "Copiar recorrentes"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ações principais */}
      {canManage && !closed && (
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={isSaving}
          style={{ width: "100%" }}
        >
          {isSaving ? "Salvando..." : "Salvar fechamento"}
        </Button>
      )}

      {canManage && (
        <Button
          type="button"
          variant="secondary"
          onClick={onToggleClose}
          style={{ width: "100%" }}
        >
          {closed ? "Reabrir mês" : "Fechar mês e bloquear edição"}
        </Button>
      )}
    </aside>
  );
}
