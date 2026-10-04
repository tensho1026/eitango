import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { getDatabaseUrl } from "../db/url";

loadEnvConfig(process.cwd());

async function main() {
  const client = new pg.Client({ connectionString: getDatabaseUrl(true), connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await migrate(drizzle(client), {
      migrationsFolder: "./drizzle-difficult",
      migrationsSchema: "drizzle",
      migrationsTable: "eitango_difficult_migrations",
    });
    console.log("苦手単語のマイグレーションが完了しました。");
  } finally {
    await client.end();
  }
}

main().catch(() => {
  // 接続エラーに含まれる可能性のある認証情報を出力しない。
  console.error("マイグレーションに失敗しました。環境変数とデータベースの接続を確認してください。");
  process.exitCode = 1;
});
