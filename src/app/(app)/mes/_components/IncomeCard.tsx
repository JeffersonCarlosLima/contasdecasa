"use client";

import { useState } from "react";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";
import type { MonthMemberItem } from "./types";

interface IncomeCardProps {
  members: MonthMemberItem[];
  incomes: Record<string, { salaryCents: number; extraCents: number }>;
  onIncomeChange: (memberId: string, field: "salaryCents" | "extraCents", val: number) => void;
  readOnly: boolean;
}

export function IncomeCard({
  members,
  incomes,
  onIncomeChange,
  readOnly,
}: IncomeCardProps) {
  // Guarda quais dependentes tiveram a renda habilitada pelo botão "Informar renda"
  const [revealedDependents, setRevealedDependents] = useState<Record<string, boolean>>({});

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2 className="title">Renda do mês</h2>

      {members.map((member, index) => {
        const income = incomes[member.id] ?? {
          salaryCents: member.salaryCents,
          extraCents: member.extraCents,
        };

        const hasIncomeRecorded = income.salaryCents > 0 || income.extraCents > 0;
        const isDependentWithoutIncome =
          !member.hasLogin && !hasIncomeRecorded && !revealedDependents[member.id];

        return (
          <div key={member.id} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {index > 0 && <div style={{ height: "1px", background: "var(--line)" }} />}

            {isDependentWithoutIncome ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span className="cc-split__name">
                  <MemberAvatar
                    name={member.displayName}
                    color={(member.color as PersonColor) || "person-a"}
                  />
                  {member.displayName}{" "}
                  <span className="caption cc-muted" style={{ fontWeight: 400 }}>
                    dependente · sem renda
                  </span>
                </span>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ minHeight: "40px" }}
                    onClick={() =>
                      setRevealedDependents((prev) => ({ ...prev, [member.id]: true }))
                    }
                  >
                    Informar renda
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span className="cc-split__name">
                  <MemberAvatar
                    name={member.displayName}
                    color={(member.color as PersonColor) || "person-a"}
                  />
                  {member.displayName}
                </span>

                <div className="cc-form">
                  <MoneyInput
                    label="Salário"
                    value={income.salaryCents}
                    onChange={(val) => onIncomeChange(member.id, "salaryCents", val ?? 0)}
                    disabled={readOnly}
                  />
                  <MoneyInput
                    label="Extra (freelas, vendas)"
                    value={income.extraCents}
                    onChange={(val) => onIncomeChange(member.id, "extraCents", val ?? 0)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
