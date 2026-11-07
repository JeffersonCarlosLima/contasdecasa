import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

function getPool(): Pool {
  if (!globalForDb.pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não definida. Veja .env.example.");
    globalForDb.pool = new Pool({ connectionString: url });
  }
  return globalForDb.pool;
}

export const pool = new Proxy(Object.create(Pool.prototype) as Pool, {
  get(_target, prop, receiver) {
    if (prop === "constructor") return Pool;
    const target = getPool();
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
