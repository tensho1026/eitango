import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../db/schema";
import { getImportConnectionString, reportError } from "./env";
import { fetchWords, saveWords } from "./target1900";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) throw new Error("使い方: npm run import:words -- [--dry-run]");
  const dryRun = args.includes("--dry-run");
  // 接続先が未設定の場合はWebページの取得前に止める。
  const connectionString = dryRun ? undefined : getImportConnectionString();
  const words = await fetchWords();
  console.log(`取得・検証完了: ${words.length}件、番号1〜1900、欠落・重複・空欄なし。`);
  if (dryRun) {
    console.log("dry-run: DBへの接続・書き込みは行いません。");
    return;
  }
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  try {
    const total = await saveWords(drizzle(pool, { schema }), words);
    console.log(`取り込み完了: ${total}件。既存のIDは維持し、変更のある内容を更新しました。`);
  } finally {
    await pool.end();
  }
}

main().catch(reportError);
