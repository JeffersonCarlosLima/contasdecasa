export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File | null): FileValidationResult {
  if (!file) {
    return { valid: false, error: "Selecione um arquivo .csv." };
  }

  const isCsv =
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel";

  if (!isCsv) {
    return { valid: false, error: "Formato inválido. Selecione um arquivo .csv." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Arquivo muito grande. O limite é de 5 MB." };
  }

  if (file.size === 0) {
    return { valid: false, error: "O arquivo selecionado está vazio." };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function guessDateColumn(headers: string[]): string {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex((h) =>
    h === "data" || h === "date" || h.includes("data") || h.includes("dt")
  );
  return index >= 0 ? (headers[index] ?? "") : (headers[0] ?? "");
}

export function guessDescriptionColumn(headers: string[]): string {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex(
    (h) =>
      h.includes("descricao") ||
      h.includes("historico") ||
      h.includes("memo") ||
      h.includes("lancamento") ||
      h.includes("detalhe") ||
      h.includes("titulo")
  );
  return index >= 0 ? (headers[index] ?? "") : (headers[1] ?? headers[0] ?? "");
}

export function guessAmountColumn(headers: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex(
    (h) =>
      h === "valor" ||
      h === "amount" ||
      h.includes("valor") ||
      h.includes("total")
  );
  return index >= 0 ? headers[index] : undefined;
}

export function guessCreditColumn(headers: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex(
    (h) => h.includes("credito") || h.includes("entrada") || h.includes("recebimento")
  );
  return index >= 0 ? headers[index] : undefined;
}

export function guessDebitColumn(headers: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex(
    (h) => h.includes("debito") || h.includes("saida") || h.includes("pagamento")
  );
  return index >= 0 ? headers[index] : undefined;
}

export function guessIdentifierColumn(headers: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  const index = normalized.findIndex(
    (h) =>
      h.includes("identificador") ||
      h === "id" ||
      h.includes("documento") ||
      h.includes("codigo") ||
      h === "doc"
  );
  return index >= 0 ? headers[index] : undefined;
}
