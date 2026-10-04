import { drizzle } from "drizzle-orm/node-postgres";
import { asc, eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "../db/schema";
import { getImportConnectionString, reportError } from "./env";
import { BOOK_SLUG, EXPECTED_COUNT } from "./target1900";
import { STUDY_RANGES } from "../src/lib/study";

async function main() {
  const pool = new pg.Pool({ connectionString: getImportConnectionString(), max: 1, connectionTimeoutMillis: 15_000 });
  try {
    const words = await drizzle(pool, { schema }).select({
      id: schema.vocabularyWords.id,
      number: schema.vocabularyWords.number,
    }).from(schema.vocabularyWords).where(eq(schema.vocabularyWords.bookSlug, BOOK_SLUG)).orderBy(asc(schema.vocabularyWords.number));
    if (words.length !== EXPECTED_COUNT || words.some((word, index) => word.number !== index + 1)) throw new Error("番号や件数が不正です。");
    if (new Set(words.map((word) => word.id)).size !== EXPECTED_COUNT) throw new Error("単語IDが重複しています。");
    console.log(`DB確認完了: ${words.length}語、番号1〜1900、欠落・重複なし。`);
    for (const range of STUDY_RANGES) {
      const total = words.filter((word) => word.number >= range.start && word.number <= range.end).length;
      if (total !== range.count) throw new Error("範囲内の件数が不正です。");
      console.log(`${range.start}〜${range.end}: ${total}語`);
    }
  } finally {
    await pool.end();
  }
}

main().catch(reportError);
