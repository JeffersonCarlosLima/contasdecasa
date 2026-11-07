"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MonthHeader } from "./MonthHeader";
import { IncomeCard } from "./IncomeCard";
import { InvestCard } from "./InvestCard";
import { SplitRuleCard } from "./SplitRuleCard";
import { SummaryAside } from "./SummaryAside";
import { ConfirmModal } from "./ConfirmModal";
import { getMonthName } from "./helpers";
import { investment } from "@/lib/calc/month";
import {
  closeMonth,
  copyRecurring,
  reopenMonth,
  saveMonthClose,
} from "@/app/(app)/mes/actions";
import type { MonthCloseData } from "./types";
import type { InvestMode, MonthSummary, SplitRule } from "@/lib/calc";
import type { MemberRole } from "@/lib/session";

interface FechamentoClientProps {
  data: MonthCloseData;
  canManage: boolean;
  role: MemberRole;
}

export function FechamentoClient({ data, canManage }: FechamentoClientProps) {
  const router = useRouter();

  // 1. Estado dos inputs do formulário
  const [incomes, setIncomes] = useState<Record<string, { salaryCents: number; extraCents: number }>>(
    () => {
      const initial: Record<string, { salaryCents: number; extraCents: number }> = {};
      data.members.forEach((m) => {
        initial[m.id] = {
          salaryCents: m.salaryCents,
          extraCents: m.extraCents,
        };
      });
      return initial;
    },
  );

  const [investMode, setInvestMode] = useState<InvestMode>(data.investMode);
  const [investValue, setInvestValue] = useState<number>(data.investValue);
  const [investDestination, setInvestDestination] = useState<string>(data.investDestination ?? "");
  const [splitRule, setSplitRule] = useState<SplitRule>(data.splitRule);

  // 2. Modais e feedback
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 3. Transições assíncronas
  const [isSaving, startSave] = useTransition();
  const [isCopying, startCopy] = useTransition();
  const [isClosingOrReopening, startCloseOrReopen] = useTransition();

  const readOnly = data.closed || !canManage;
  const monthName = getMonthName(data.month);

  // 4. Cálculo instantâneo do resumo em tempo real
  const dynamicSummary: MonthSummary = useMemo(() => {
    let incomeCents = 0;
    data.members.forEach((m) => {
      const inc = incomes[m.id] ?? { salaryCents: m.salaryCents, extraCents: m.extraCents };
      incomeCents += inc.salaryCents + inc.extraCents;
    });

    const investmentCents = investment(investMode, investValue, incomeCents);
    const availableCents = incomeCents - investmentCents;
    const spentCents = data.summary.spentCents;
    const leftoverCents = availableCents - spentCents;

    return {
      incomeCents,
      investmentCents,
      availableCents,
      spentCents,
      leftoverCents,
    };
  }, [data.members, data.summary.spentCents, incomes, investMode, investValue]);

  // Manipuladores de alteração de renda
  const handleIncomeChange = (
    memberId: string,
    field: "salaryCents" | "extraCents",
    val: number,
  ) => {
    setIncomes((prev) => ({
      ...prev,
      [memberId]: {
        salaryCents: field === "salaryCents" ? val : (prev[memberId]?.salaryCents ?? 0),
        extraCents: field === "extraCents" ? val : (prev[memberId]?.extraCents ?? 0),
      },
    }));
    if (feedback) setFeedback(null);
  };

  // Salvar fechamento
  const handleSave = () => {
    setFeedback(null);
    startSave(async () => {
      const payload = {
        month: data.month,
        incomes: data.members.map((m) => ({
          memberId: m.id,
          salaryCents: incomes[m.id]?.salaryCents ?? m.salaryCents,
          extraCents: incomes[m.id]?.extraCents ?? m.extraCents,
        })),
        investMode,
        investValue,
        investDestination,
        splitRule,
      };

      const res = await saveMonthClose(payload);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }

      setFeedback({ type: "success", text: "Fechamento salvo com sucesso!" });
      router.refresh();
    });
  };

  // Copiar recorrentes
  const handleCopyRecurring = () => {
    setFeedback(null);
    startCopy(async () => {
      const res = await copyRecurring(data.month);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        return;
      }
      setFeedback({ type: "success", text: "Despesas recorrentes copiadas com sucesso!" });
      router.refresh();
    });
  };

  // Alternar fechamento / reabertura
  const handleToggleClose = () => {
    if (data.closed) {
      // Reabrir
      setFeedback(null);
      startCloseOrReopen(async () => {
        const res = await reopenMonth(data.month);
        if (!res.ok) {
          setFeedback({ type: "error", text: res.error });
          return;
        }
        setFeedback({ type: "success", text: "Mês reaberto para edições." });
        router.refresh();
      });
    } else {
      // Abrir modal de confirmação para fechar
      setIsConfirmCloseOpen(true);
    }
  };

  const handleConfirmClose = () => {
    setFeedback(null);
    startCloseOrReopen(async () => {
      const res = await closeMonth(data.month);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.error });
        setIsConfirmCloseOpen(false);
        return;
      }
      setIsConfirmCloseOpen(false);
      setFeedback({ type: "success", text: "Mês fechado e protegido contra alterações." });
      router.refresh();
    });
  };

  return (
    <div className="cc-wrap">
      <MonthHeader month={data.month} closed={data.closed} />

      {feedback && (
        <div
          role={feedback.type === "success" ? "status" : "alert"}
          aria-live="polite"
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            background: feedback.type === "success" ? "var(--invest-soft)" : "var(--danger-soft)",
            color: feedback.type === "success" ? "var(--invest)" : "var(--danger)",
            fontWeight: 500,
            fontSize: "14px",
          }}
        >
          {feedback.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Coluna Principal */}
        <div
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <IncomeCard
            members={data.members}
            incomes={incomes}
            onIncomeChange={handleIncomeChange}
            readOnly={readOnly}
          />

          <InvestCard
            mode={investMode}
            value={investValue}
            destination={investDestination}
            totalIncomeCents={dynamicSummary.incomeCents}
            monthName={monthName}
            onModeChange={setInvestMode}
            onValueChange={setInvestValue}
            onDestinationChange={setInvestDestination}
            readOnly={readOnly}
          />

          <SplitRuleCard
            rule={splitRule}
            members={data.members}
            incomes={incomes}
            onRuleChange={setSplitRule}
            readOnly={readOnly}
          />
        </div>

        {/* Coluna Resumo */}
        <SummaryAside
          month={data.month}
          previousMonthLabel={data.previousMonthLabel}
          summary={dynamicSummary}
          split={data.split}
          members={data.members}
          recurring={data.recurring}
          closed={data.closed}
          canManage={canManage}
          isSaving={isSaving}
          isCopyingRecurring={isCopying}
          onSave={handleSave}
          onCopyRecurring={handleCopyRecurring}
          onToggleClose={handleToggleClose}
        />
      </div>

      {/* Modal de Confirmação para Fechar Mês */}
      <ConfirmModal
        isOpen={isConfirmCloseOpen}
        title={`Fechar mês de ${monthName}?`}
        description={
          <>
            Ao fechar o mês, as rendas, o investimento e a divisão ficam protegidos contra novas
            alterações. Nenhum lançamento poderá ser modificado enquanto o mês estiver fechado.
            <br />
            <br />
            Administradores e o dono podem reabrir o mês a qualquer momento.
          </>
        }
        confirmLabel="Fechar mês e bloquear edição"
        confirmVariant="primary"
        isPending={isClosingOrReopening}
        onConfirm={handleConfirmClose}
        onCancel={() => setIsConfirmCloseOpen(false)}
      />
    </div>
  );
}
