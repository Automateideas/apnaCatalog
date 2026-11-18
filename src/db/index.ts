import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Kept on globalThis so dev reloads reuse one pool. The version in the key starts a fresh pool
// when the connection settings below change.
const POOL_KEY = "__apnaDbV2";
const globalForDb = globalThis as unknown as Record<typeof POOL_KEY, Db | undefined>;

function connect(): Db {
  const cached = globalForDb[POOL_KEY];
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  const max = Number(process.env.DB_POOL_MAX) || 5;
  const client = postgres(url, {
    prepare: false, // required by Supabase's transaction pooler
    max,
    idle_timeout: 20,
    // Give up on a connection that cannot open in 10 s instead of hanging the page,
    // and replace every connection after 30 minutes, so one stuck after a pooler hiccup goes away.
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
  const db = drizzle(client, { schema });
  globalForDb[POOL_KEY] = db;
  return db;
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
