import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations prefer the session-mode connection when one is given.
  dbCredentials: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
});
