import { defineConfig } from "drizzle-kit";

// generateはDBへの接続なしで使える。適用はscripts/migrate.tsで行う。
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
