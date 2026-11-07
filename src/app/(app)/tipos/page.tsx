import { requireMember } from "@/lib/session";
import { listCategories, listPaymentMethods } from "@/lib/catalog-queries";
import { listFamily } from "@/lib/family-queries";
import {
  CategorySection,
  PaymentMethodSection,
  RulesSection,
  type RuleItem,
} from "./_components";

export default async function TiposPage() {
  const { familyId, role } = await requireMember();
  const canEdit = role === "admin" || role === "dono";

  let rules: RuleItem[] = [];
  try {
    const importQueries = await import("@/lib/import-queries");
    if (typeof importQueries.listRules === "function") {
      rules = await importQueries.listRules(familyId);
    }
  } catch {
    // Queries de importação ainda em inicialização
  }

  const [categories, paymentMethods, familyData] = await Promise.all([
    listCategories(familyId),
    listPaymentMethods(familyId),
    listFamily(familyId),
  ]);

  return (
    <main className="cc-main">
      <div className="cc-wrap">
        <div className="cc-top">
          <div className="cc-top__titles">
            <h1 className="heading cc-hide-sm">Tipos de despesa</h1>
            <span className="body cc-muted">
              Os tipos agrupam as despesas no dashboard. A cor é a mesma em
              todos os gráficos.
            </span>
          </div>
        </div>

        <CategorySection categories={categories} canEdit={canEdit} />

        <PaymentMethodSection
          paymentMethods={paymentMethods}
          members={familyData.members}
          canEdit={canEdit}
        />

        <RulesSection
          rules={rules}
          categories={categories}
          paymentMethods={paymentMethods}
          members={familyData.members}
          canEdit={canEdit}
        />
      </div>
    </main>
  );
}
