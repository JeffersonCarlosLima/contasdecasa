import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { families } from "@/db/schema";
import { listCategories, listPaymentMethods } from "@/lib/catalog-queries";
import { parseMonthParam } from "@/lib/dates";
import { listFamily } from "@/lib/family-queries";
import { requireMember } from "@/lib/session";
import { ExpenseForm } from "../_form/ExpenseForm";

export const metadata: Metadata = {
  title: "Lançar despesa — Contas da Casa",
};

interface NovaDespesaPageProps {
  searchParams?: Promise<{ mes?: string }>;
}

export default async function NovaDespesaPage({ searchParams }: NovaDespesaPageProps) {
  const { member, familyId } = await requireMember();
  const search = searchParams ? await searchParams : undefined;
  const mes = parseMonthParam(search?.mes);

  const [categories, paymentMethods, familyData, [familyRow]] = await Promise.all([
    listCategories(familyId),
    listPaymentMethods(familyId),
    listFamily(familyId),
    db
      .select({ defaultSplitRule: families.defaultSplitRule })
      .from(families)
      .where(eq(families.id, familyId))
      .limit(1),
  ]);

  return (
    <main className="cc-main">
      <div className="cc-wrap" style={{ maxWidth: 880 }}>
        <ExpenseForm
          mode="create"
          familyId={familyId}
          currentMember={{
            id: member.id,
            displayName: member.displayName,
            role: member.role,
          }}
          defaultSplitRule={familyRow?.defaultSplitRule ?? "proporcional"}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          }))}
          paymentMethods={paymentMethods.map((pm) => ({
            id: pm.id,
            name: pm.name,
          }))}
          members={familyData.members.map((m) => ({
            id: m.id,
            displayName: m.displayName,
            color: m.color,
            participatesInSplit: m.participatesInSplit,
            status: m.status,
          }))}
          initialMonth={mes}
        />
      </div>
    </main>
  );
}
