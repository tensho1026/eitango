import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./db/url";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/difficult-schema.ts",
  out: "./drizzle-difficult",
  dbCredentials: { url: getDatabaseUrl(true) },
  migrations: { schema: "drizzle", table: "eitango_difficult_migrations" },
});
