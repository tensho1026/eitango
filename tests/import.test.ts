import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseWords, saveLocalWords, validateWords, type VocabularyWord } from "../scripts/target1900";

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

test("ローカルファイルへ保存し、再取得でIDを維持し、不完全なデータは上書きしない", async () => {
  const directory = await mkdtemp(join(tmpdir(), "eitango-import-"));
  const destination = join(directory, "data", "target1900.json");
  try {
    const words = fixture();
    assert.equal(await saveLocalWords([...words].reverse(), destination), 1900);
    const original = JSON.parse(await readFile(destination, "utf8"));
    assert.equal(original.words[0].number, 1);
    assert.equal(original.words[1899].number, 1900);
    words[0].meaning = "更新した意味；注釈（⇒ 223）";
    await saveLocalWords(words, destination);
    const saved = await readFile(destination, "utf8");
    const updated = JSON.parse(saved);
    assert.deepEqual(updated.words.map((row: { id: string }) => row.id), original.words.map((row: { id: string }) => row.id));
    assert.equal(updated.words[0].meaning, words[0].meaning);
    await assert.rejects(saveLocalWords(words.slice(1), destination), /1900件必要/);
    assert.equal(await readFile(destination, "utf8"), saved);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
