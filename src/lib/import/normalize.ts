/**
 * Normaliza descrições bancárias para classificação e deduplicação consistentes:
 * - Maiúsculas
 * - Sem acentos
 * - Sem datas (ex: 05/11/2026, 05/11/26, 2026-11-05)
 * - Sem sufixos de parcelas (ex: 2/10, 02/10, PARC 1/3)
 * - Sem números longos (IDs de transação, autorizações, documentos)
 * - Espaços colapsados
 */
export function normalizeDescription(description: string): string {
  if (!description) {
    return "";
  }

  let text = description.trim();

  // 1. Remover acentuação e passar para maiúsculas
  text = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  // 2. Remover datas (DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD, DD-MM-YYYY)
  text = text
    .replace(/\b\d{2}\/\d{2}\/\d{2,4}\b/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{2}-\d{2}-\d{2,4}\b/g, " ");

  // 3. Remover parcelas (ex: "PARC 2/10", "PARCELA 01/12", "2/10", "03/12")
  text = text
    .replace(/\bPARC(?:ELA)?\s*\d{1,2}(?:\/\d{1,2})?\b/g, " ")
    .replace(/\b\d{1,2}\/\d{1,2}\b/g, " ");

  // 4. Remover números longos (>= 4 dígitos consecutivos como documentos, contas, códigos de autorização)
  text = text.replace(/\b\d{4,}\b/g, " ");

  // 5. Remover pontuações soltas ou repetidas deixadas pela remoção de números/datas
  text = text.replace(/[_\-*#]+/g, " ");

  // 6. Colapsar espaços e trim final
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
