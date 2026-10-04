import "server-only";
import { and, asc, between, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../db/schema";
import type { StudyRange, StudyWord } from "./study";

const databaseGlobal = globalThis as unknown as { eitangoPool?: pg.Pool };

function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URLが設定されていません。");
  const pool = databaseGlobal.eitangoPool ?? new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
  databaseGlobal.eitangoPool = pool;
  return drizzle(pool, { schema });
}

export async function getStudyWords(range: StudyRange): Promise<StudyWord[]> {
  const { vocabularyWords } = schema;
  const words = await getDatabase().select({
    id: vocabularyWords.id, number: vocabularyWords.number,
    word: vocabularyWords.word, meaning: vocabularyWords.meaning,
  }).from(vocabularyWords).where(and(
    eq(vocabularyWords.bookSlug, "target-1900-6th"),
    between(vocabularyWords.number, range.start, range.end),
  )).orderBy(asc(vocabularyWords.number));
  if (words.length !== range.count || words.some((word, index) => word.number !== range.start + index)) {
    throw new Error("選択した範囲の単語データが揃っていません。");
  }
  return words;
}
