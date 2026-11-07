import type { LayoutId, MappingConfig } from "./types";

export interface LayoutDefinition {
  id: LayoutId;
  name: string;
  status: "a validar";
  config: MappingConfig;
  preambleLines?: number;
  stopOnFirstEmptyLine?: boolean;
  stopPatterns?: string[];
  validateBalance?: boolean;
  balanceColumn?: string;
  invertAmount?: boolean;
  extractPeriod?: (lines: string[]) => { from: string; to: string } | undefined;
}

export const BRADESCO_CONTA_LAYOUT: LayoutDefinition = {
  id: "bradesco-conta",
  name: "Bradesco Conta Corrente",
  status: "a validar",
  preambleLines: 1, // 1 linha de preâmbulo (ex: agência/conta - nunca salva)
  stopOnFirstEmptyLine: true, // termina na 1ª linha em branco
  stopPatterns: ["LANÇAMENTOS PERIÓDICOS", "LANCAMENTOS PERIODICOS", "TOTAL", "SALDO ANTERIOR"],
  validateBalance: true,
  balanceColumn: "Saldo (R$)",
  config: {
    separator: ";",
    headerSignature: ["Data", "Histórico", "Docto.", "Crédito (R$)", "Débito (R$)", "Saldo (R$)"],
    dateColumn: "Data",
    dateFormat: "dd/mm/yy", // Bradesco comumente usa DD/MM/YY ou DD/MM/YYYY
    descriptionColumns: ["Histórico"],
    creditColumn: "Crédito (R$)",
    debitColumn: "Débito (R$)",
    externalIdColumn: "Docto.",
    decimal: ",",
  },
};

export const INTER_CONTA_LAYOUT: LayoutDefinition = {
  id: "inter-conta",
  name: "Inter Conta Corrente",
  status: "a validar",
  preambleLines: 4, // 4 linhas de preâmbulo (título / Conta / Período / Saldo)
  stopOnFirstEmptyLine: false,
  validateBalance: false, // SEM validação de saldo
  extractPeriod: (lines: string[]) => {
    for (const line of lines.slice(0, 10)) {
      const match = line.match(/(?:Per[ií]odo:?\s*)(\d{2}\/\d{2}\/\d{4})\s*(?:a|at[eé]|-)\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (match && match[1] && match[2]) {
        const d1 = match[1];
        const d2 = match[2];
        const parts1 = d1.split("/");
        const parts2 = d2.split("/");
        const day1 = parts1[0] ?? "";
        const month1 = parts1[1] ?? "";
        const year1 = parts1[2] ?? "";
        const day2 = parts2[0] ?? "";
        const month2 = parts2[1] ?? "";
        const year2 = parts2[2] ?? "";
        return {
          from: `${year1}-${month1}-${day1}`,
          to: `${year2}-${month2}-${day2}`,
        };
      }
    }
    return undefined;
  },
  config: {
    separator: ";",
    headerSignature: ["Data Lançamento", "Histórico", "Descrição", "Valor", "Saldo"],
    dateColumn: "Data Lançamento",
    dateFormat: "dd/mm/yyyy",
    descriptionColumns: ["Histórico", "Descrição"], // Concatena Histórico + Descrição
    amountColumn: "Valor",
    decimal: ",",
  },
};

export const NUBANK_CONTA_LAYOUT: LayoutDefinition = {
  id: "nubank-conta",
  name: "Nubank Conta Corrente",
  status: "a validar",
  preambleLines: 0,
  stopOnFirstEmptyLine: false,
  validateBalance: false,
  config: {
    separator: ",",
    headerSignature: ["Data", "Valor", "Identificador", "Descrição"],
    dateColumn: "Data",
    dateFormat: "dd/mm/yyyy",
    descriptionColumns: ["Descrição"],
    amountColumn: "Valor",
    externalIdColumn: "Identificador",
    decimal: ".",
  },
};

export const NUBANK_CARTAO_LAYOUT: LayoutDefinition = {
  id: "nubank-cartao",
  name: "Nubank Cartão de Crédito",
  status: "a validar",
  preambleLines: 0,
  stopOnFirstEmptyLine: false,
  validateBalance: false,
  invertAmount: true, // No CSV de cartão Nubank, compras são valores positivos e pagamentos negativos. Invertemos para padronizar despesa como negativa.
  config: {
    separator: ",",
    headerSignature: ["date", "category", "title", "amount"],
    dateColumn: "date",
    dateFormat: "yyyy-mm-dd",
    descriptionColumns: ["title"],
    amountColumn: "amount",
    decimal: ".",
  },
};

export const PREDEFINED_LAYOUTS: LayoutDefinition[] = [
  BRADESCO_CONTA_LAYOUT,
  INTER_CONTA_LAYOUT,
  NUBANK_CONTA_LAYOUT,
  NUBANK_CARTAO_LAYOUT,
];
