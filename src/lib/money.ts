const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 123456 → "R$ 1.234,56"; negativo → "−R$ 412,30" (sinal de menos U+2212). */
export function formatBRL(cents: number): string {
  const text = brl.format(Math.abs(cents) / 100).replace(/ /g, " ");
  return cents < 0 ? `−${text}` : text;
}

/** "1.234,56" | "R$ 1.234,56" | "12,5" → centavos inteiros. Vazio/ inválido → null. */
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;
  const negative = cleaned.startsWith("-");
  const normalized = cleaned.replace(/-/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d*\.?\d{0,2}$/.test(normalized) || normalized === "" || normalized === ".") return null;
  const [int = "0", frac = ""] = normalized.split(".");
  const cents = Number(int) * 100 + Number(frac.padEnd(2, "0"));
  return negative ? -cents : cents;
}

/** Percentual em pontos-base: 4920 → "49,2%". */
export function formatPercentBp(bp: number): string {
  return `${(bp / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
