import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

// Reuse the connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __rozSql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.__rozSql ??
  postgres(url, {
    max: 5,
    // Neon's pooled endpoint runs pgbouncer in transaction mode; prepared statements must be off.
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__rozSql = sql;

export const db = drizzle(sql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
