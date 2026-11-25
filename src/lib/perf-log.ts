/**
 * Log enxuto de desempenho (visível em `docker logs`), sem OpenTelemetry nem serviço externo.
 * Uma linha JSON por evento, para dar grep/jq: {"perf":"slow-query", ...}.
 */

export function envMs(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function logPerf(event: string, data: Record<string, unknown>): void {
  console.warn(JSON.stringify({ perf: event, ...data }));
}

/**
 * Mede uma chamada assíncrona e registra se passar do limite (`SLOW_QUERY_MS`, padrão 200 ms;
 * 0 desativa). Só o início do SQL vai para o log, nunca os parâmetros (podem ter dados da família).
 */
export function timeQuery<T>(sqlText: string, run: () => Promise<T>): Promise<T> {
  const limit = envMs("SLOW_QUERY_MS", 200);
  if (limit === 0) return run();
  const started = performance.now();
  const done = () => {
    const ms = Math.round(performance.now() - started);
    if (ms >= limit) logPerf("slow-query", { ms, sql: sqlText.replace(/\s+/g, " ").slice(0, 120) });
  };
  return run().then(
    (r) => {
      done();
      return r;
    },
    (e) => {
      done();
      throw e;
    },
  );
}
