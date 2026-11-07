import { createHash } from "node:crypto";

export interface FingerprintParams {
  familyId: string;
  paymentMethodId?: string | null;
  date: string; // AAAA-MM-DD
  amountCents: number;
  descriptionNormalized: string;
  externalId?: string | null;
}

/**
 * Gera fingerprint SHA-256 único e determinístico para a linha do extrato.
 * Usado para detectar duplicidades na importação.
 */
export function fingerprint(params: FingerprintParams): string {
  const parts = [
    params.familyId.trim(),
    (params.paymentMethodId ?? "").trim(),
    params.date.trim(),
    String(params.amountCents),
    params.descriptionNormalized.trim(),
    (params.externalId ?? "").trim(),
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex");
}
