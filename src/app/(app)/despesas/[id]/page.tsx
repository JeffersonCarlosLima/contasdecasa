import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { families } from "@/db/schema";
import { listCategories, listPaymentMethods } from "@/lib/catalog-queries";
import { getExpense } from "@/lib/expense-queries";
import { listFamily } from "@/lib/family-queries";
import { requireMember } from "@/lib/session";
import { ExpenseForm } from "../_form/ExpenseForm";

export const metadata: Metadata = {
  title: "Editar despesa — Contas da Casa",
};

interface EditDespesaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDespesaPage({ params }: EditDespesaPageProps) {
  const { id } = await params;
  const { member, familyId } = await requireMember();

  const [expense, categories, paymentMethods, familyData, [familyRow]] = await Promise.all([
    getExpense(familyId, id),
    listCategories(familyId),
    listPaymentMethods(familyId),
    listFamily(familyId),
    db
      .select({ defaultSplitRule: families.defaultSplitRule })
      .from(families)
      .where(eq(families.id, familyId))
      .limit(1),
  ]);

  if (!expense) {
    notFound();
  }

  const canEdit =
    member.role !== "membro" ||
    expense.owner === null ||
    expense.owner.id === member.id;

  const canDelete = canEdit;

  return (
    <main className="cc-main">
      <div className="cc-wrap" style={{ maxWidth: 880 }}>
        <ExpenseForm
          mode="edit"
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
          initialExpense={{
            id: expense.id,
            description: expense.description,
            amountCents: expense.amountCents,
            categoryId: expense.category.id,
            ownerMemberId: expense.owner?.id ?? null,
            paymentMethodId: expense.paymentMethod?.id ?? null,
            dueDate: expense.dueDate,
            status: expense.status,
            paidAt: expense.paidAt,
            paidByMemberId: expense.paidBy?.id ?? null,
            installment: expense.installment,
            recurring: expense.recurring,
            notes: expense.notes,
            referenceMonth: expense.referenceMonth,
          }}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </main>
  );
}
