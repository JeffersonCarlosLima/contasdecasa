export type LayoutId =
  | "bradesco-conta"
  | "inter-conta"
  | "nubank-conta"
  | "nubank-cartao"
  | "mapeado";

export type DateFormat = "dd/mm/yyyy" | "yyyy-mm-dd" | "dd/mm/yy";

export interface MappingConfig {
  separator: ";" | "," | "\t";
  headerSignature: string[];
  dateColumn: string;
  dateFormat: DateFormat;
  descriptionColumns: string[];
  amountColumn?: string;
  creditColumn?: string;
  debitColumn?: string;
  externalIdColumn?: string;
  decimal: "," | ".";
}

export interface ParsedRow {
  lineNo: number;
  date: string; // 'AAAA-MM-DD'
  descriptionOriginal: string;
  descriptionNormalized: string;
  amountCents: number; // com sinal; negativo = saída (despesa), positivo = entrada (receita)
  externalId?: string;
}

export interface ParseWarning {
  lineNo?: number;
  code: string;
  message: string;
}

export interface ParseResult {
  layout: LayoutId | "desconhecido";
  rows: ParsedRow[];
  warnings: ParseWarning[];
  period?: { from: string; to: string };
  headers?: string[];
  sample?: string[][];
}

export type MatchType = "contem" | "comeca";

export interface ClassificationRule {
  matchType: MatchType;
  pattern: string;
  /** Nome a gravar na despesa quando a regra casa. */
  displayName?: string | null;
  categoryId: string;
  ownerId?: string | null;
  paymentMethodId?: string | null;
  priority?: number;
}

export type SuggestedType = "despesa" | "receita" | "salario" | "ignorar";

export interface TypeSuggestion {
  type: SuggestedType;
  ignoreReason?: string;
}

export interface PendingExpenseCandidate {
  id: string;
  amountCents: number;
  month: string;
  dueDate: string;
}

export interface SameDayExpenseCandidate {
  id: string;
  amountCents: number;
  date: string; // AAAA-MM-DD (dia de paid_at ou due_date)
  paymentMethodId: string | null;
}

export type MatchSituation = "nova" | "duplicada" | "possivel_vinculo";

export interface MatchResult {
  situation: MatchSituation;
  matchedExpenseId?: string;
}

export interface TransferRowCandidate {
  id: string;
  paymentMethodId: string | null;
  date: string;
  amountCents: number;
  descriptionNormalized: string;
}
