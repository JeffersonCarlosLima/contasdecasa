export type SplitRule = "igual" | "proporcional" | "personalizada";
export type InvestMode = "valor" | "percentual";

/** Membro como a calculadora o enxerga. Todos os valores em centavos / pontos-base. */
export interface CalcMember {
  id: string;
  participatesInSplit: boolean;
  /** Salário do mês (sem extras). */
  salaryCents: number;
  /** Percentual personalizado em pontos-base (5000 = 50%). */
  customPercentBp?: number | null;
}

export interface CalcExpense {
  amountCents: number;
  /** null = despesa da Família (compartilhada). */
  ownerMemberId: string | null;
  status: "pendente" | "pago";
  paidByMemberId?: string | null;
}

export interface MemberIncome {
  salaryCents: number;
  extraCents: number;
}

export interface MemberSummary {
  memberId: string;
  /** Despesas em que ele é dono. */
  ownCents: number;
  /** Parte dele nas despesas da Família. */
  familyShareCents: number;
  /** ownCents + familyShareCents. */
  responsibilityCents: number;
  /** Soma das despesas pagas por ele. */
  paidCents: number;
  /** Responsabilidade apenas sobre despesas já pagas (base do acerto). */
  paidResponsibilityCents: number;
  /** paidCents − paidResponsibilityCents. Positivo = tem a receber. */
  balanceCents: number;
}

export interface Settlement {
  fromMemberId: string;
  toMemberId: string;
  cents: number;
}

export interface SplitResult {
  members: MemberSummary[];
  /** Despesas da Família sem ninguém na divisão (não atribuídas). */
  unassignedFamilyCents: number;
  settlements: Settlement[];
}
