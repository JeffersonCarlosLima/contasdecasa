import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { timeQuery } from "@/lib/perf-log";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

/** Lê um inteiro não negativo do ambiente; valor ausente ou inválido usa o padrão. */
export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function getPool(): Pool {
  if (!globalForDb.pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não definida. Veja .env.example.");
    globalForDb.pool = new Pool({
      connectionString: url,
      // Poucas conexões bastam (1 instância, 2 usuários) e poupam o PostgreSQL compartilhado.
      max: envInt("DB_POOL_MAX", 10),
      idleTimeoutMillis: envInt("DB_IDLE_TIMEOUT_MS", 30_000),
      // Falha rápido em vez de pendurar a requisição se o banco não responder.
      connectionTimeoutMillis: envInt("DB_CONNECT_TIMEOUT_MS", 5_000),
      // Corta consultas travadas (0 desativa).
      statement_timeout: envInt("DB_STATEMENT_TIMEOUT_MS", 15_000),
    });
  }
  return globalForDb.pool;
}

export const pool = new Proxy(Object.create(Pool.prototype) as Pool, {
  get(_target, prop, receiver) {
    if (prop === "constructor") return Pool;
    const target = getPool();
    const value = Reflect.get(target, prop, receiver);
    if (prop === "query" && typeof value === "function") {
      // Registra consultas lentas (SLOW_QUERY_MS) sem alterar o resultado.
      return (...args: unknown[]) => {
        const first = args[0];
        const text =
          typeof first === "string"
            ? first
            : typeof first === "object" && first !== null && "text" in first
              ? String((first as { text: unknown }).text)
              : "";
        return timeQuery(text, () => (value as (...a: unknown[]) => Promise<unknown>).apply(target, args));
      };
    }
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
/** Transação do Drizzle (parâmetro `tx` de `db.transaction`). */
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
