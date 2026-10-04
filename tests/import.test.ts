import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema";
import { BOOK_SLUG, parseWords, saveWords, validateWords, type VocabularyWord } from "../scripts/target1900";

function fixture(): VocabularyWord[] {
  return Array.from({ length: 1900 }, (_, i) => ({ number: i + 1, word: `test-word-${i + 1}`, meaning: `テスト用の意味${i + 1}`, isNew: false }));
}

function table(words: VocabularyWord[]) {
  return '<table><tr><th></th><th>番号</th><th>単語</th><th>意味</th></tr>' + words.map((w) =>
    `<tr><td>${w.isNew ? "新" : ""}</td><td>${w.number}</td><td>${w.word}</td><td>${w.meaning}</td></tr>`,
  ).join("") + "</table>";
}

test("HTMLの表だけを読み、番号順に並べてHTMLエンティティと注釈を保持する", () => {
  const words = fixture();
  words[0] = { number: 1, word: "sample", meaning: "意味；（注釈） &amp; 参照 ⇒ 223", isNew: true };
  const parsed = parseWords('<table><tr><td>広告</td></tr></table>' + table(words.reverse()));
  assert.equal(parsed.length, 1900);
  assert.deepEqual(parsed[0], { number: 1, word: "sample", meaning: "意味；（注釈） & 参照 ⇒ 223", isNew: true });
  assert.equal(parsed.at(-1)?.number, 1900);
});

test("ページの構造が違う場合は停止する", () => {
  assert.throws(() => parseWords("<html>アクセス制限</html>"), /単語表を特定/);
  assert.throws(() => parseWords(table(fixture()) + table(fixture())), /単語表を特定/);
});

test("欠落、重複、範囲外の番号を拒否する", () => {
  assert.throws(() => validateWords(fixture().slice(1)), /1900件必要/);
  for (const number of [1, 1901, 0, 1.5]) {
    const words = fixture();
    words[1].number = number;
    assert.throws(() => validateWords(words), /番号の範囲・重複/);
  }
});

test("単語・意味の空欄とHTMLの列数変更を拒否する", () => {
  const words = fixture();
  words[7].meaning = "　 ";
  assert.throws(() => validateWords(words), /不正/);
  assert.throws(() => parseWords(table(fixture()).replace('<td>1</td>', '<td>1</td><td>extra</td>')), /列数/);
});

test("不正な番号・新規フラグを拒否する", () => {
  assert.throws(() => parseWords(table(fixture()).replace('<td>1</td>', '<td>1x</td>')), /形式が不正/);
  assert.throws(() => parseWords(table(fixture()).replace('<td></td>', '<td>?</td>')), /形式が不正/);
});

test("Postgresへの再取り込みでID・学習履歴を保持し、途中失敗は全件ロールバックする", async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    // 同じマイグレーションを再実行できる。
    await migrate(db, { migrationsFolder: "./drizzle" });
    const words = fixture();
    assert.equal(await saveWords(db, words), 1900);
    const original = await db.select().from(schema.vocabularyWords).orderBy(asc(schema.vocabularyWords.number));
    await db.execute(sql`CREATE TABLE test_progress (word_id uuid PRIMARY KEY REFERENCES vocabulary_words(id), correct_count integer NOT NULL)`);
    await db.execute(sql`INSERT INTO test_progress VALUES (${original[0].id}, 7)`);

    // SQLの構文に見える文字列もデータとして保存される。
    words[0].meaning = "' ; DROP TABLE vocabulary_words; -- テスト";
    await saveWords(db, words);
    const updated = await db.select().from(schema.vocabularyWords).where(eq(schema.vocabularyWords.bookSlug, BOOK_SLUG)).orderBy(asc(schema.vocabularyWords.number));
    assert.equal(updated.length, 1900);
    assert.deepEqual(updated.map((row) => row.id), original.map((row) => row.id));
    assert.equal(updated[0].meaning, words[0].meaning);
    assert.equal(updated[0].createdAt.getTime(), original[0].createdAt.getTime());
    assert.equal(updated[1].updatedAt.getTime(), original[1].updatedAt.getTime());
    assert.equal((await client.query<{ correct_count: number }>("SELECT correct_count FROM test_progress")).rows[0].correct_count, 7);

    await db.execute(sql`CREATE FUNCTION test_reject_word() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.word = 'reject-me' THEN RAISE EXCEPTION 'deliberate failure'; END IF; RETURN NEW; END $$`);
    await db.execute(sql`CREATE TRIGGER test_failure BEFORE INSERT OR UPDATE ON vocabulary_words FOR EACH ROW EXECUTE FUNCTION test_reject_word()`);
    words[0].meaning = "この変更もロールバックされる";
    words[350].word = "reject-me";
    await assert.rejects(saveWords(db, words));
    const [afterFailure] = await db.select().from(schema.vocabularyWords).where(eq(schema.vocabularyWords.number, 1));
    assert.equal(afterFailure.meaning, updated[0].meaning);
  } finally {
    await client.close();
  }
});
