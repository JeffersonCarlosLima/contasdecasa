import type { PersonColor } from "@/components/ui/MemberAvatar";

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  type?: string;
  archived?: boolean;
  closingDay?: number | null;
  dueDay?: number | null;
}

export interface MemberOption {
  id: string;
  displayName: string;
  color: PersonColor;
  participatesInSplit: boolean;
  status: string;
}

export interface CurrentMember {
  id: string;
  displayName: string;
  role: string;
}

export interface ExpenseInitialData {
  id: string;
  description: string;
  amountCents: number;
  categoryId: string;
  ownerMemberId: string | null;
  paymentMethodId: string | null;
  dueDate: string;
  status: "pendente" | "pago" | "atrasado";
  paidAt?: Date | null;
  paidByMemberId?: string | null;
  installment?: {
    current: number;
    total: number;
  } | null;
  recurring: boolean;
  notes?: string | null;
  referenceMonth: string;
}

export interface ExpenseFormProps {
  mode: "create" | "edit";
  familyId: string;
  currentMember: CurrentMember;
  defaultSplitRule: string;
  categories: CategoryOption[];
  paymentMethods: PaymentMethodOption[];
  members: MemberOption[];
  initialExpense?: ExpenseInitialData;
  initialMonth?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}
