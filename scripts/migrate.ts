import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { getImportConnectionString, reportError } from "./env";

async function main() {
  const pool = new pg.Pool({ connectionString: getImportConnectionString(), max: 1, connectionTimeoutMillis: 15_000 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log("マイグレーションが完了しました。");
  } finally {
    await pool.end();
  }
}

main().catch(reportError);
