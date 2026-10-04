import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/difficult-schema";
import { getDifficultNumbers, setDifficultWord } from "../db/difficult-repository";
import { isLearnerId, readDifficultPayload, selectDifficultWords } from "../src/lib/difficult";
import { getAllStudyWords } from "../src/lib/words";

test("苦手単語の入力は掲載番号1〜1900と保存状態だけを受け付ける", () => {
  assert.deepEqual(readDifficultPayload({ number: 1, saved: true }), { number: 1, saved: true });
  assert.deepEqual(readDifficultPayload({ number: 1900, saved: false }), { number: 1900, saved: false });
  for (const number of [0, 1901, -1, 1.5, "1", null, NaN]) {
    assert.equal(readDifficultPayload({ number, saved: true }), null);
  }
  for (const value of [null, [], {}, { number: 1 }, { number: 1, saved: "true" }]) {
    assert.equal(readDifficultPayload(value), null);
  }
  assert.equal(isLearnerId(randomUUID()), true);
  for (const value of [undefined, "", "learner", "00000000-0000-0000-0000-000000000000"]) {
    assert.equal(isLearnerId(value), false);
  }
});

test("範囲をまたいだ苦手単語を掲載順に抽出し、不正値と重複を除く", () => {
  const words = getAllStudyWords();
  assert.deepEqual(selectDifficultWords(words, [1900, 201, 1, 201, 0, 1901]).map((word) => word.number), [1, 201, 1900]);
  assert.deepEqual(selectDifficultWords(words, []), []);
});

test("マイグレーションの再実行・登録の重複・利用者別の読み込みと解除をPostgresで検証する", async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  try {
    const config = { migrationsFolder: "./drizzle-difficult", migrationsSchema: "drizzle", migrationsTable: "eitango_difficult_migrations" };
    await migrate(db, config);
    await migrate(db, config);
    const first = randomUUID();
    const second = randomUUID();
    assert.deepEqual(await getDifficultNumbers(db, first), []);
    await setDifficultWord(db, first, 1900, true);
    await setDifficultWord(db, first, 1, true);
    assert.deepEqual(await setDifficultWord(db, first, 1, true), [1, 1900]);
    assert.deepEqual(await setDifficultWord(db, second, 1, true), [1]);
    assert.deepEqual(await setDifficultWord(db, first, 1, false), [1900]);
    assert.deepEqual(await getDifficultNumbers(db, second), [1]);
    assert.deepEqual(await setDifficultWord(db, first, 1, false), [1900]);
    assert.deepEqual(await setDifficultWord(db, first, 1900, false), []);
    await assert.rejects(db.insert(schema.difficultWords).values({ learnerId: first, wordNumber: 1901 }));
    const migrations = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM drizzle.eitango_difficult_migrations");
    assert.equal(migrations.rows[0].count, 1);
  } finally {
    await client.close();
  }
});
