/**
 * Divide `totalCents` proporcionalmente a `weights` (inteiros >= 0) sem perder centavo:
 * cada parte é arredondada para baixo e a sobra do arredondamento vai inteira para a
 * maior parte (empate: o primeiro). A soma do resultado é sempre exatamente `totalCents`.
 */
export function allocate(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  const shares =
    sum === 0
      ? weights.map(() => Math.floor(totalCents / weights.length))
      : weights.map((w) => Math.floor((totalCents * w) / sum));
  const remainder = totalCents - shares.reduce((a, b) => a + b, 0);
  if (remainder !== 0) {
    let target = 0;
    weights.forEach((w, i) => {
      if (w > (weights[target] ?? 0)) target = i;
    });
    shares[target] = (shares[target] ?? 0) + remainder;
  }
  return shares;
}
