import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./difficult-schema";

export async function getDifficultNumbers<T extends PgQueryResultHKT>(db: PgDatabase<T, typeof schema>, learnerId: string): Promise<number[]> {
  const rows = await db.select({ number: schema.difficultWords.wordNumber }).from(schema.difficultWords)
    .where(eq(schema.difficultWords.learnerId, learnerId)).orderBy(asc(schema.difficultWords.wordNumber));
  return rows.map((row) => row.number);
}

export async function setDifficultWord<T extends PgQueryResultHKT>(db: PgDatabase<T, typeof schema>, learnerId: string, number: number, saved: boolean): Promise<number[]> {
  if (saved) {
    await db.insert(schema.difficultWords).values({ learnerId, wordNumber: number }).onConflictDoNothing();
  } else {
    await db.delete(schema.difficultWords).where(and(eq(schema.difficultWords.learnerId, learnerId), eq(schema.difficultWords.wordNumber, number)));
  }
  return getDifficultNumbers(db, learnerId);
}
