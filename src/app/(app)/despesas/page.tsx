import Link from "next/link";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { parseMonthParam, type DisplayStatus } from "@/lib/dates";
import { listExpenses } from "@/lib/expense-queries";
import { listCategories } from "@/lib/catalog-queries";
import { listFamily } from "@/lib/family-queries";
import { isMonthClosed } from "@/lib/period";
import { requireMember } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { ExpenseListView, formatSplitNames, type ViewMode } from "./_list";

interface DespesasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const sp = await searchParams;
  const mesParam = typeof sp.mes === "string" ? sp.mes : undefined;
  const month = parseMonthParam(mesParam);
  const mode: ViewMode = sp.modo === "data" ? "data" : "pessoa";
  const statusParam =
    typeof sp.status === "string" &&
    ["pago", "pendente", "atrasado"].includes(sp.status)
      ? (sp.status as DisplayStatus)
      : null;
  const categoryParam = typeof sp.tipo === "string" ? sp.tipo : null;
  const memberParam = typeof sp.membro === "string" ? sp.membro : null;

  const { familyId } = await requireMember();

  const [expenseData, categories, familyData, closed] = await Promise.all([
    listExpenses(familyId, month, {
      categoryId: categoryParam,
      memberId: memberParam,
      status: statusParam,
    }),
    listCategories(familyId),
    listFamily(familyId),
    isMonthClosed(familyId, month),
  ]);

  const activeMembers = familyData.members.filter(
    (m) => m.status !== "removido"
  );
  const splitDescription = formatSplitNames(activeMembers);

  const count = expenseData.totals.count;
  const countLabel = count === 1 ? "lançamento" : "lançamentos";

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        <div className="cc-top">
          <div className="cc-top__titles">
            <h1 className="heading cc-hide-sm">Despesas da família</h1>
            <span className="body cc-muted">
              {count} {countLabel} · {formatBRL(expenseData.totals.totalCents)} ·{" "}
              {formatBRL(expenseData.totals.pendingCents)} pendentes
            </span>
          </div>

          <div className="cc-actions">
            <MonthSwitcher
              month={month}
              basePath="/despesas"
              closed={closed}
            />
            <Link
              className="cc-btn cc-btn--primary cc-hide-sm"
              href="/despesas/nova"
              style={{ textDecoration: "none" }}
            >
              Lançar despesa
            </Link>
          </div>
        </div>

        <ExpenseListView
          mode={mode}
          month={month}
          currentStatus={statusParam}
          currentCategory={categoryParam}
          currentMember={memberParam}
          categories={categories}
          members={activeMembers.map((m) => ({
            id: m.id,
            displayName: m.displayName,
            color: m.color,
          }))}
          items={expenseData.items}
          groups={expenseData.groups}
          closed={closed}
          splitDescription={splitDescription}
        />
      </div>
    </main>
  );
}
