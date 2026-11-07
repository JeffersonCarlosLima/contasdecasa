import type { LayoutId, MappingConfig } from "@/lib/import/types";

export type { LayoutId, MappingConfig };

export interface PaymentMethodOption {
  id: string;
  name: string;
}

export interface MemberOption {
  id: string;
  displayName: string;
  color: string;
  role: string;
}

export interface CurrentMember {
  id: string;
  displayName: string;
  role: string;
}

export interface NeedsMappingData {
  headers: string[];
  sample: string[][];
}

export interface UploadFormProps {
  currentMember: CurrentMember;
  paymentMethods: PaymentMethodOption[];
  members: MemberOption[];
  canEdit?: boolean;
}
