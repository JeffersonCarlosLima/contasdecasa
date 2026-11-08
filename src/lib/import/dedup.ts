export interface IncomeDedupParams {
  fingerprint: string;
  type: string;
  confirmedIncomeFingerprints: Set<string>;
  seenIncomeFingerprints?: Set<string>;
}

/**
 * Verifica se uma linha de receita ou salário é duplicada com base em:
 * 1. Fingerprint já presente em lote confirmado (não desfeito) da mesma família
 * 2. Fingerprint já processado anteriormente no mesmo lote (quando fornecido seenIncomeFingerprints)
 */
export function isDuplicateIncome(params: IncomeDedupParams): boolean {
  if (params.type !== "receita" && params.type !== "salario") {
    return false;
  }
  if (!params.fingerprint) {
    return false;
  }
  if (params.confirmedIncomeFingerprints.has(params.fingerprint)) {
    return true;
  }
  if (params.seenIncomeFingerprints?.has(params.fingerprint)) {
    return true;
  }
  return false;
}
