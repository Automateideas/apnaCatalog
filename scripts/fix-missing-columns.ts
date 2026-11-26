import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL || "");

const columns = [
  `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "max_price" integer`,
  `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT '[]'::jsonb NOT NULL`,
  `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "listing" text`,
  `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "details" jsonb DEFAULT '[]'::jsonb NOT NULL`,
  `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "sale_price" integer`,
  `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "state" text`,
];

async function main() {
  for (const stmt of columns) {
    await sql.unsafe(stmt);
    console.log("OK:", stmt.slice(0, 60));
  }
  await sql.end();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
