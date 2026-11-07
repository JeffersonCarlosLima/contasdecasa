import { normalizeDescription } from "./normalize";
import {
  PREDEFINED_LAYOUTS,
  type LayoutDefinition,
} from "./layouts";
import type {
  DateFormat,
  LayoutId,
  MappingConfig,
  ParsedRow,
  ParseResult,
  ParseWarning,
} from "./types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5000;

export function decodeBuffer(buffer: Uint8Array): string {
  // Verifica UTF-8 BOM: 0xEF, 0xBB, 0xBF
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buffer.subarray(3));
  }

  // Tenta UTF-8 estrito; caso falhe com caracteres inválidos, faz fallback para ISO-8859-1
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("iso-8859-1").decode(buffer);
  }
}

export function tokenizeCsvLine(line: string, separator: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(cleanField(current));
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(cleanField(current));
  return fields;
}

function cleanField(val: string): string {
  let v = val.trim();
  if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function parseCents(raw: string, decimal: "," | "."): number | null {
  if (!raw) return null;
  let s = raw.trim();
  if (s === "" || s === "-" || s === "+") return null;

  let isNegative = false;
  if (s.startsWith("-")) {
    isNegative = true;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) {
    s = s.slice(1).trim();
  } else if (s.startsWith("(") && s.endsWith(")")) {
    isNegative = true;
    s = s.slice(1, -1).trim();
  } else if (s.endsWith("D") || s.endsWith("d")) {
    isNegative = true;
    s = s.slice(0, -1).trim();
  } else if (s.endsWith("C") || s.endsWith("c")) {
    isNegative = false;
    s = s.slice(0, -1).trim();
  }

  // Remove moeda e espaços
  s = s.replace(/[R$r$\s]/g, "");

  if (decimal === ",") {
    // Milhar é ponto
    s = s.replace(/\./g, "");
    const parts = s.split(",");
    if (parts.length > 2) return null;
    const intPart = parts[0] || "0";
    const decPart = (parts[1] || "").padEnd(2, "0").slice(0, 2);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    const cents = parseInt(intPart, 10) * 100 + parseInt(decPart, 10);
    return isNegative ? -cents : cents;
  } else {
    // Decimal é ponto, milhar é vírgula
    s = s.replace(/,/g, "");
    const parts = s.split(".");
    if (parts.length > 2) return null;
    const intPart = parts[0] || "0";
    const decPart = (parts[1] || "").padEnd(2, "0").slice(0, 2);
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decPart)) return null;
    const cents = parseInt(intPart, 10) * 100 + parseInt(decPart, 10);
    return isNegative ? -cents : cents;
  }
}

export function parseDate(raw: string, format: DateFormat): string | null {
  if (!raw) return null;
  const s = raw.trim().split(" ")[0] ?? "";
  if (!s) return null;

  if (format === "yyyy-mm-dd") {
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match && match[1] && match[2] && match[3]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    // Fallback se vier em dd/mm/yyyy
    const fallbackMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (fallbackMatch && fallbackMatch[1] && fallbackMatch[2] && fallbackMatch[3]) {
      return `${fallbackMatch[3]}-${fallbackMatch[2].padStart(2, "0")}-${fallbackMatch[1].padStart(2, "0")}`;
    }
  } else if (format === "dd/mm/yyyy") {
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match && match[1] && match[2] && match[3]) {
      return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
    const match2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (match2 && match2[1] && match2[2] && match2[3]) {
      const yy = parseInt(match2[3], 10);
      const year = yy < 70 ? `20${match2[3]}` : `19${match2[3]}`;
      return `${year}-${match2[2].padStart(2, "0")}-${match2[1].padStart(2, "0")}`;
    }
  } else if (format === "dd/mm/yy") {
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (match && match[1] && match[2] && match[3]) {
      const yy = parseInt(match[3], 10);
      const year = yy < 70 ? `20${match[3]}` : `19${match[3]}`;
      return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
    const match4 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match4 && match4[1] && match4[2] && match4[3]) {
      return `${match4[3]}-${match4[2].padStart(2, "0")}-${match4[1].padStart(2, "0")}`;
    }
  }

  return null;
}

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchesSignature(tokens: string[], signature: string[]): boolean {
  if (tokens.length < signature.length) return false;
  const normTokens = tokens.map(normalizeHeader);
  const normSig = signature.map(normalizeHeader);

  return normSig.every((sigCol) =>
    normTokens.some((tokenCol) => tokenCol.includes(sigCol) || sigCol.includes(tokenCol))
  );
}

function detectLayout(lines: string[]): {
  layoutDef: LayoutDefinition;
  headerIndex: number;
} | null {
  const separators: Array<";" | "," | "\t"> = [";", ",", "\t"];

  for (let lineIdx = 0; lineIdx < Math.min(lines.length, 15); lineIdx++) {
    const line = lines[lineIdx]?.trim();
    if (!line) continue;

    for (const sep of separators) {
      const tokens = tokenizeCsvLine(line, sep);
      if (tokens.length < 2) continue;

      for (const layoutDef of PREDEFINED_LAYOUTS) {
        if (matchesSignature(tokens, layoutDef.config.headerSignature)) {
          return { layoutDef, headerIndex: lineIdx };
        }
      }
    }
  }

  return null;
}

function guessSeparator(lines: string[]): ";" | "," | "\t" {
  let countSemi = 0;
  let countComma = 0;
  let countTab = 0;

  for (const line of lines.slice(0, 10)) {
    if (!line) continue;
    countSemi += (line.match(/;/g) || []).length;
    countComma += (line.match(/,/g) || []).length;
    countTab += (line.match(/\t/g) || []).length;
  }

  if (countSemi >= countComma && countSemi >= countTab && countSemi > 0) return ";";
  if (countTab >= countComma && countTab >= countSemi && countTab > 0) return "\t";
  return ",";
}

export function parseCsv(buffer: Uint8Array, mapping?: MappingConfig): ParseResult {
  const warnings: ParseWarning[] = [];

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      layout: "desconhecido",
      rows: [],
      warnings: [
        {
          code: "FILE_TOO_LARGE",
          message: "O arquivo excede o limite máximo permitido de 5 MB.",
        },
      ],
    };
  }

  const text = decodeBuffer(buffer);
  const lines = text.split(/\r\n|\n|\r/);

  // 1. Caso mapeamento customizado seja informado
  if (mapping) {
    return parseWithConfig(lines, mapping, "mapeado", warnings);
  }

  // 2. Detecção automática de layout pré-definido
  const detected = detectLayout(lines);
  if (detected) {
    const { layoutDef, headerIndex } = detected;
    return parseWithLayoutDefinition(lines, layoutDef, headerIndex, warnings);
  }

  // 3. Layout desconhecido: extrai cabeçalhos e amostra para o fluxo needsMapping
  const sep = guessSeparator(lines);
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i]?.trim();
    if (l) {
      headerIndex = i;
      headers = tokenizeCsvLine(l, sep);
      break;
    }
  }

  const sample: string[][] = [];
  if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < lines.length && sample.length < 5; i++) {
      const l = lines[i]?.trim();
      if (l) {
        sample.push(tokenizeCsvLine(l, sep));
      }
    }
  }

  return {
    layout: "desconhecido",
    rows: [],
    warnings,
    headers,
    sample,
  };
}

function parseWithLayoutDefinition(
  lines: string[],
  layoutDef: LayoutDefinition,
  headerIndex: number,
  warnings: ParseWarning[]
): ParseResult {
  let period = layoutDef.extractPeriod ? layoutDef.extractPeriod(lines) : undefined;
  const config = layoutDef.config;
  const headerLine = lines[headerIndex] ?? "";
  const headerTokens = tokenizeCsvLine(headerLine, config.separator);

  const colIndexMap = new Map<string, number>();
  headerTokens.forEach((token, idx) => {
    colIndexMap.set(normalizeHeader(token), idx);
  });

  const getColIdx = (colName?: string) => {
    if (!colName) return -1;
    const norm = normalizeHeader(colName);
    let found = -1;
    colIndexMap.forEach((idx, key) => {
      if (found === -1 && (key.includes(norm) || norm.includes(key))) {
        found = idx;
      }
    });
    return found;
  };

  const dateIdx = getColIdx(config.dateColumn);
  const amountIdx = getColIdx(config.amountColumn);
  const creditIdx = getColIdx(config.creditColumn);
  const debitIdx = getColIdx(config.debitColumn);
  const extIdIdx = getColIdx(config.externalIdColumn);
  const balanceIdx = getColIdx(layoutDef.balanceColumn);

  const descIndices: number[] = [];
  for (const col of config.descriptionColumns) {
    const idx = getColIdx(col);
    if (idx !== -1) descIndices.push(idx);
  }

  const rows: ParsedRow[] = [];
  let previousBalanceCents: number | null = null;
  let minDate = "";
  let maxDate = "";

  for (let lineNo = headerIndex + 2; lineNo <= lines.length; lineNo++) {
    const line = lines[lineNo - 1];
    if (line === undefined) continue;
    const trimmed = line.trim();

    // Condições de parada
    if (layoutDef.stopOnFirstEmptyLine && trimmed === "") {
      break;
    }
    if (!trimmed) {
      continue;
    }

    const upperTrimmed = trimmed.toUpperCase();
    if (layoutDef.stopPatterns?.some((p) => upperTrimmed.includes(p))) {
      break;
    }

    const tokens = tokenizeCsvLine(line, config.separator);
    if (tokens.length < 2) {
      continue;
    }

    // Validação de limite de linhas
    if (rows.length >= MAX_ROWS) {
      warnings.push({
        lineNo,
        code: "LIMITE_LINHAS_EXCEDIDO",
        message: "Arquivo excede o limite de 5.000 linhas. As linhas excedentes foram ignoradas.",
      });
      break;
    }

    // 1. Data
    const rawDate = dateIdx !== -1 && tokens[dateIdx] !== undefined ? tokens[dateIdx]! : "";
    const parsedDate = parseDate(rawDate, config.dateFormat);
    if (!parsedDate) {
      warnings.push({
        lineNo,
        code: "DATA_INVALIDA",
        message: `Linha ${lineNo}: Data inválida "${rawDate}".`,
      });
      continue;
    }

    // 2. Descrição
    const descParts: string[] = [];
    for (const dIdx of descIndices) {
      const p = tokens[dIdx]?.trim();
      if (p) descParts.push(p);
    }
    const descriptionOriginal = descParts.join(" - ") || "Sem descrição";
    const descriptionNormalized = normalizeDescription(descriptionOriginal);

    // 3. Valor
    let amountCents: number | null = null;

    if (amountIdx !== -1 && tokens[amountIdx] !== undefined) {
      amountCents = parseCents(tokens[amountIdx]!, config.decimal);
    } else if (creditIdx !== -1 || debitIdx !== -1) {
      const rawCredit = creditIdx !== -1 && tokens[creditIdx] !== undefined ? tokens[creditIdx]! : "";
      const rawDebit = debitIdx !== -1 && tokens[debitIdx] !== undefined ? tokens[debitIdx]! : "";

      const creditVal = parseCents(rawCredit, config.decimal);
      const debitVal = parseCents(rawDebit, config.decimal);

      if (creditVal !== null && creditVal !== 0) {
        amountCents = Math.abs(creditVal);
      } else if (debitVal !== null && debitVal !== 0) {
        amountCents = -Math.abs(debitVal);
      }
    }

    if (amountCents === null) {
      warnings.push({
        lineNo,
        code: "VALOR_INVALIDO",
        message: `Linha ${lineNo}: Valor ausente ou inválido.`,
      });
      continue;
    }

    if (layoutDef.invertAmount) {
      amountCents = -amountCents;
    }

    // 4. External ID
    const externalId = extIdIdx !== -1 && tokens[extIdIdx] !== undefined ? tokens[extIdIdx]!.trim() || undefined : undefined;

    // 5. Validação de Saldo (quando habilitado, ex: Bradesco)
    if (layoutDef.validateBalance && balanceIdx !== -1 && tokens[balanceIdx] !== undefined) {
      const rawBalance = tokens[balanceIdx]!;
      const curBalanceCents = parseCents(rawBalance, config.decimal);

      if (curBalanceCents !== null && previousBalanceCents !== null) {
        const expected: number = previousBalanceCents + amountCents;
        if (expected !== curBalanceCents) {
          warnings.push({
            lineNo,
            code: "SALDO_INCONSISTENTE",
            message: `Linha ${lineNo}: Saldo inconsistente (esperado: ${expected}, informado: ${curBalanceCents}).`,
          });
        }
      }
      if (curBalanceCents !== null) {
        previousBalanceCents = curBalanceCents;
      }
    }

    // Acumular período caso não venha no cabeçalho
    if (!minDate || parsedDate < minDate) minDate = parsedDate;
    if (!maxDate || parsedDate > maxDate) maxDate = parsedDate;

    rows.push({
      lineNo,
      date: parsedDate,
      descriptionOriginal,
      descriptionNormalized,
      amountCents,
      externalId,
    });
  }

  if (!period && minDate && maxDate) {
    period = { from: minDate, to: maxDate };
  }

  return {
    layout: layoutDef.id,
    rows,
    warnings,
    period,
  };
}

function parseWithConfig(
  lines: string[],
  config: MappingConfig,
  layoutId: LayoutId,
  warnings: ParseWarning[]
): ParseResult {
  const customDef: LayoutDefinition = {
    id: layoutId,
    name: "Configuração Mapeada",
    status: "a validar",
    config,
  };

  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const l = lines[i]?.trim();
    if (!l) continue;
    const tokens = tokenizeCsvLine(l, config.separator);
    if (matchesSignature(tokens, config.headerSignature)) {
      headerIndex = i;
      break;
    }
  }

  return parseWithLayoutDefinition(lines, customDef, headerIndex, warnings);
}
