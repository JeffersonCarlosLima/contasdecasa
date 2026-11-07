import type { Metadata } from "next";
import { requireMember } from "@/lib/session";
import { parseMonthParam } from "@/lib/dates";
import { getMonthClose } from "@/lib/period-queries";
import { FechamentoClient } from "./_components/FechamentoClient";
import { getMonthName } from "./_components/helpers";

interface MesPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export async function generateMetadata({ searchParams }: MesPageProps): Promise<Metadata> {
  const { mes } = await searchParams;
  const month = parseMonthParam(mes);
  const monthName = getMonthName(month);

  return {
    title: `Fechamento de ${monthName} — Contas da Casa`,
  };
}

export default async function MesPage({ searchParams }: MesPageProps) {
  const { mes } = await searchParams;
  const month = parseMonthParam(mes);

  const { familyId, role } = await requireMember();
  const data = await getMonthClose(familyId, month);

  const canManage = role === "admin" || role === "dono";

  return (
    <main className="cc-main">
      <FechamentoClient data={data} canManage={canManage} role={role} />
    </main>
  );
}
