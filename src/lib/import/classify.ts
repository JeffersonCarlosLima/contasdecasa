import { normalizeDescription } from "./normalize";
import type {
  ClassificationRule,
  MatchResult,
  ParsedRow,
  PendingExpenseCandidate,
  SameDayExpenseCandidate,
  TransferRowCandidate,
  TypeSuggestion,
} from "./types";

export const DEFAULT_FATURA_PATTERNS = [
  "PAGAMENTO DE FATURA",
  "PGTO FATURA",
  "PAGAMENTO FATURA",
  "PAGTO FATURA",
  "PAG FATURA",
];

export const DEFAULT_SALARIO_PATTERNS = [
  "TED C SAL",
  "SALARIO",
  "REMUNERACAO",
  "PROVENTOS",
  "FOLHA DE PAGAMENTO",
  "PAGTO SALARIO",
];

export function applyRules(
  row: ParsedRow,
  rules: ClassificationRule[]
): { categoryId: string; ownerId: string | null; paymentMethodId: string | null } | null {
  if (!rules || rules.length === 0) {
    return null;
  }

  // Ordena por prioridade decrescente (maior número = maior prioridade)
  const sortedRules = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const descNorm = row.descriptionNormalized;

  for (const rule of sortedRules) {
    const patternNorm = normalizeDescription(rule.pattern);
    if (!patternNorm) continue;

    let isMatch = false;
    if (rule.matchType === "comeca") {
      isMatch = descNorm.startsWith(patternNorm);
    } else if (rule.matchType === "contem") {
      isMatch = descNorm.includes(patternNorm);
    }

    if (isMatch) {
      return {
        categoryId: rule.categoryId,
        ownerId: rule.ownerId ?? null,
        paymentMethodId: rule.paymentMethodId ?? null,
      };
    }
  }

  return null;
}

export function suggestType(
  row: ParsedRow,
  patterns?: { fatura?: string[]; salario?: string[] }
): TypeSuggestion {
  const faturaPatterns = patterns?.fatura ?? DEFAULT_FATURA_PATTERNS;
  const salarioPatterns = patterns?.salario ?? DEFAULT_SALARIO_PATTERNS;

  const descNorm = row.descriptionNormalized;

  // 1. Verifica padrão de pagamento de fatura (ignorar para não duplicar com extrato do cartão)
  for (const pat of faturaPatterns) {
    const pNorm = normalizeDescription(pat);
    if (pNorm && descNorm.includes(pNorm)) {
      return {
        type: "ignorar",
        ignoreReason: "Pagamento de fatura de cartão de crédito (evita duplicar com as despesas do cartão)",
      };
    }
  }

  // 2. Se valor zero
  if (row.amountCents === 0) {
    return {
      type: "ignorar",
      ignoreReason: "Lançamento com valor zero",
    };
  }

  // 3. Entradas (amountCents > 0)
  if (row.amountCents > 0) {
    for (const pat of salarioPatterns) {
      const pNorm = normalizeDescription(pat);
      if (pNorm && descNorm.includes(pNorm)) {
        return { type: "salario" };
      }
    }
    return { type: "receita" };
  }

  // 4. Saídas (amountCents < 0)
  return { type: "despesa" };
}

function parseDateUtc(d: string): number {
  const parts = d.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return Date.UTC(y, m - 1, day);
}

function daysDiff(d1: string, d2: string): number {
  const ms1 = parseDateUtc(d1);
  const ms2 = parseDateUtc(d2);
  return Math.abs(Math.round((ms1 - ms2) / (1000 * 60 * 60 * 24)));
}

/**
 * Identifica pares de transferência própria entre contas da mesma família:
 * - Sinal oposto e mesmo valor absoluto
 * - Até 1 dia de diferença de data
 * - Meios de pagamento diferentes
 * - Dá preferência a descrições que contenham nome de algum membro ou palavras-chave de transferência
 */
export function findOwnTransfers(
  rows: TransferRowCandidate[],
  memberNames: string[] = []
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const used = new Set<string>();

  const normalizedMembers = memberNames
    .map((name) => normalizeDescription(name))
    .filter(Boolean);

  const transferKeywords = ["PIX", "TRANSF", "TRANSFERENCIA", "TEF", "DOC", "TED"];

  for (let i = 0; i < rows.length; i++) {
    const rowA = rows[i];
    if (!rowA || used.has(rowA.id) || rowA.amountCents === 0) continue;

    let bestMatchIdx = -1;
    let bestScore = -1;

    for (let j = i + 1; j < rows.length; j++) {
      const rowB = rows[j];
      if (!rowB || used.has(rowB.id) || rowB.amountCents === 0) continue;

      // 1. Sinal oposto e mesmo valor absoluto
      if (rowA.amountCents !== -rowB.amountCents) continue;

      // 2. Meios de pagamento diferentes
      if (rowA.paymentMethodId && rowB.paymentMethodId && rowA.paymentMethodId === rowB.paymentMethodId) {
        continue;
      }

      // 3. Até 1 dia de diferença
      const diff = daysDiff(rowA.date, rowB.date);
      if (diff > 1) continue;

      // Cálculo de afinidade para desempate
      let score = 10 - diff * 2; // Mesma data = 10, 1 dia = 8

      // Pontua se a descrição contém nome de membro
      const hasMemberA = normalizedMembers.some((m) => rowA.descriptionNormalized.includes(m));
      const hasMemberB = normalizedMembers.some((m) => rowB.descriptionNormalized.includes(m));
      if (hasMemberA || hasMemberB) score += 10;

      // Pontua palavras-chave de transferência
      const hasKwA = transferKeywords.some((kw) => rowA.descriptionNormalized.includes(kw));
      const hasKwB = transferKeywords.some((kw) => rowB.descriptionNormalized.includes(kw));
      if (hasKwA || hasKwB) score += 5;

      if (score > bestScore) {
        bestScore = score;
        bestMatchIdx = j;
      }
    }

    if (bestMatchIdx !== -1) {
      const rowB = rows[bestMatchIdx];
      if (rowB) {
        used.add(rowA.id);
        used.add(rowB.id);
        pairs.push([rowA.id, rowB.id]);
      }
    }
  }

  return pairs;
}

/**
 * Avalia o status da linha em relação aos dados existentes:
 * Prioridade:
 * 1. duplicada por fingerprint
 * 2. duplicada por mesma data, mesmo valor e mesma forma de pagamento (sameDayExpenses)
 * 3. possivel_vinculo com despesa pendente
 * 4. nova
 */
export function matchStatus(
  row: ParsedRow,
  context: {
    existingFingerprints: Set<string>;
    pendingExpenses?: PendingExpenseCandidate[];
    sameDayExpenses?: SameDayExpenseCandidate[];
    rowFingerprint?: string;
    paymentMethodId?: string | null;
  }
): MatchResult {
  // 1. Prioridade 1: Duplicidade por fingerprint
  if (context.rowFingerprint && context.existingFingerprints.has(context.rowFingerprint)) {
    return { situation: "duplicada" };
  }

  // 2. Prioridade 2: Duplicidade por mesmo dia, mesmo valor e mesma forma de pagamento
  if (row.amountCents < 0 && context.sameDayExpenses && context.sameDayExpenses.length > 0) {
    const absCents = Math.abs(row.amountCents);

    for (const exp of context.sameDayExpenses) {
      const paymentMatches =
        context.paymentMethodId !== undefined
          ? exp.paymentMethodId === context.paymentMethodId
          : true;

      if (
        exp.amountCents === absCents &&
        exp.date === row.date &&
        paymentMatches
      ) {
        return {
          situation: "duplicada",
          matchedExpenseId: exp.id,
        };
      }
    }
  }

  // 3. Prioridade 3: Possível vínculo com despesa pendente
  if (row.amountCents < 0 && context.pendingExpenses && context.pendingExpenses.length > 0) {
    const absCents = Math.abs(row.amountCents);
    const rowMonth = row.date.slice(0, 7);

    for (const exp of context.pendingExpenses) {
      if (exp.amountCents === absCents) {
        // Coincidência no mesmo mês ou com vencimento até 7 dias da data da transação
        const sameMonth = exp.month.slice(0, 7) === rowMonth;
        const diff = daysDiff(row.date, exp.dueDate);

        if (sameMonth || diff <= 7) {
          return {
            situation: "possivel_vinculo",
            matchedExpenseId: exp.id,
          };
        }
      }
    }
  }

  return { situation: "nova" };
}
