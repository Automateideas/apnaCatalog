import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __apnaDb?: Db };

function connect(): Db {
  if (globalForDb.__apnaDb) return globalForDb.__apnaDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  // prepare:false is required by Supabase's transaction pooler.
  const max = Number(process.env.DB_POOL_MAX) || 5;
  const client = postgres(url, { prepare: false, max, idle_timeout: 20 });
  globalForDb.__apnaDb = drizzle(client, { schema });
  return globalForDb.__apnaDb;
}

/** Connects on first use, so the app can build without a database. */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = connect();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);
