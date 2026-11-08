import { KpiCard } from "@/components/ui/KpiCard";
import { formatIncomeHint, formatInvestHint, formatSpentHint } from "./helpers";
import type { DashboardKPIs } from "./types";

interface DashboardKpisProps {
  kpis: DashboardKPIs;
  pendingCents: number;
}

export function DashboardKpis({ kpis, pendingCents }: DashboardKpisProps) {
  const sobraTone = kpis.leftoverCents < 0 ? "negative" : "positive";

  return (
    <section className="cc-kpis" style={{ padding: 0 }} aria-label="Indicadores do mês">
      <KpiCard
        label="Renda do mês"
        cents={kpis.incomeCents}
        hint={formatIncomeHint(kpis.incomeCents)}
        tone="neutro"
      />
      <KpiCard
        label="Investimento"
        cents={kpis.investmentCents}
        hint={formatInvestHint(kpis.investmentCents, kpis.incomeCents)}
        tone="invest"
      />
      <KpiCard
        label="Disponível"
        cents={kpis.availableCents}
        hint="Renda − investimento"
        tone="neutro"
      />
      <KpiCard
        label="Gasto"
        cents={kpis.spentCents}
        hint={formatSpentHint(pendingCents)}
        tone="neutro"
      />
      <KpiCard
        label="Sobra"
        cents={kpis.leftoverCents}
        hint="Livre até o fim do mês"
        tone={sobraTone}
      />
    </section>
  );
}
