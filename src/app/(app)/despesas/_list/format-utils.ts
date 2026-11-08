export function formatSplitNames(
  members: Array<{ displayName: string; participatesInSplit?: boolean }>
): string {
  const names = members
    .filter((m) => m.participatesInSplit !== false)
    .map((m) => m.displayName);

  if (names.length === 0) return "";
  if (names.length === 1) return `dividida com ${names[0]}`;
  if (names.length === 2) return `dividida entre ${names[0]} e ${names[1]}`;
  return `dividida entre ${names.slice(0, -1).join(", ")} e ${
    names[names.length - 1]
  }`;
}

export function formatInstallmentText(
  installment: { current: number; total: number } | null | undefined,
  recurring: boolean
): string {
  if (installment) {
    return `${installment.current} de ${installment.total}`;
  }
  if (recurring) {
    return "Recorrente";
  }
  return "—";
}

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-11" → "novembro de 2026" */
export function formatMonthLong(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const name = MONTHS_PT[(m ?? 1) - 1] ?? "";
  return `${name} de ${y}`;
}

