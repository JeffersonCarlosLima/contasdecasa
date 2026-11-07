"use client";

import Link from "next/link";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { formatBRL } from "@/lib/money";
import { computeMemberPercentages } from "./helpers";
import type { MonthMemberItem } from "./types";
import type { SplitRule } from "@/lib/calc";

interface SplitRuleCardProps {
  rule: SplitRule;
  members: MonthMemberItem[];
  incomes: Record<string, { salaryCents: number; extraCents: number }>;
  onRuleChange: (rule: SplitRule) => void;
  readOnly: boolean;
}

export function SplitRuleCard({
  rule,
  members,
  incomes,
  onRuleChange,
  readOnly,
}: SplitRuleCardProps) {
  const membersWithCurrentSalaries = members.map((m) => ({
    id: m.id,
    participatesInSplit: m.participatesInSplit,
    salaryCents: incomes[m.id]?.salaryCents ?? m.salaryCents,
    customPercent: m.customPercent,
  }));

  const percentages = computeMemberPercentages(rule, membersWithCurrentSalaries);

  return (
    <section className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h2 className="title">Divisão das despesas da família</h2>
      <span className="caption cc-muted">
        Vale só para despesas marcadas como &quot;Família&quot;. Cada um continua responsável pelas próprias.
      </span>

      <div className="cc-seg" role="group" aria-label="Regra de divisão" style={{ alignSelf: "flex-start" }}>
        <button
          type="button"
          aria-pressed={rule === "igual"}
          onClick={() => !readOnly && onRuleChange("igual")}
          disabled={readOnly}
        >
          Partes iguais
        </button>
        <button
          type="button"
          aria-pressed={rule === "proporcional"}
          onClick={() => !readOnly && onRuleChange("proporcional")}
          disabled={readOnly}
        >
          Proporcional ao salário
        </button>
        <button
          type="button"
          aria-pressed={rule === "personalizada"}
          onClick={() => !readOnly && onRuleChange("personalizada")}
          disabled={readOnly}
        >
          Personalizada
        </button>
      </div>

      <div className="cc-list" style={{ boxShadow: "none" }}>
        {members.map((member) => {
          const salary = incomes[member.id]?.salaryCents ?? member.salaryCents;
          const metaText = member.participatesInSplit
            ? `Participa · salário ${formatBRL(salary)}`
            : "Não participa da divisão";
          const percentText = percentages.get(member.id) ?? "—";

          return (
            <div key={member.id} className="cc-member">
              <MemberAvatar
                name={member.displayName}
                color={(member.color as PersonColor) || "person-a"}
              />
              <div className="cc-member__main">
                <span className="cc-member__name">{member.displayName}</span>
                <span className="cc-member__meta">{metaText}</span>
              </div>
              <span className={`cc-cat__val ${percentText === "—" ? "cc-muted" : ""}`}>
                {percentText}
              </span>
            </div>
          );
        })}
      </div>

      <span className="caption cc-muted">
        Quem participa é definido em{" "}
        <Link href="/familia" style={{ color: "var(--brand-ink)", textDecoration: "underline" }}>
          Família
        </Link>
        . Extras não entram no cálculo proporcional.
      </span>
    </section>
  );
}
