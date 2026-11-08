import { requireMember } from "@/lib/session";
import { parseMonthParam } from "@/lib/dates";
import { getDashboard } from "@/lib/dashboard-queries";
import { DashboardHeader } from "./_dashboard/DashboardHeader";
import { DashboardFilters } from "./_dashboard/DashboardFilters";
import { DashboardKpis } from "./_dashboard/DashboardKpis";
import { DashboardBudget } from "./_dashboard/DashboardBudget";
import { DashboardGrid2 } from "./_dashboard/DashboardGrid2";
import { DashboardUpcoming } from "./_dashboard/DashboardUpcoming";
import { DashboardEmpty } from "./_dashboard/DashboardEmpty";

interface PageProps {
  searchParams: Promise<{
    mes?: string;
    membro?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sessionMember = await requireMember();
  const { mes, membro } = await searchParams;

  const month = parseMonthParam(mes);
  const memberId = membro && membro.trim() ? membro.trim() : undefined;

  const data = await getDashboard(sessionMember.familyId, month, memberId);

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        {/* 1. Topo */}
        <DashboardHeader
          month={month}
          monthLabel={data.monthLabel}
          closed={data.closed}
        />

        {/* 2. Filtro Ver dados de */}
        <DashboardFilters
          month={month}
          members={data.members}
          selectedMemberId={memberId}
        />

        {data.empty ? (
          <DashboardEmpty month={month} monthLabel={data.monthLabel} />
        ) : (
          <>
            {/* 3. KPIs */}
            <DashboardKpis
              kpis={data.kpis}
              pendingCents={data.budget.pendingCents}
            />

            {/* 4. Para onde vai a renda */}
            <DashboardBudget
              monthLabel={data.monthLabel}
              incomeCents={data.kpis.incomeCents}
              budget={data.budget}
            />

            {/* 5. Grade de 2 colunas */}
            <DashboardGrid2
              byPerson={data.byPerson}
              byCategory={data.byCategory}
              split={data.split}
              totalSpentCents={data.totalSpentCents}
            />

            {/* 6. Próximos vencimentos */}
            <DashboardUpcoming upcoming={data.upcoming} />
          </>
        )}
      </div>
    </main>
  );
}
