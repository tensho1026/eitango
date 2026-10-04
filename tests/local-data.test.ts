import assert from "node:assert/strict";
import test from "node:test";
import dataset from "../src/data/target1900.json";
import { getStudyWords } from "../src/lib/words";
import { STUDY_RANGES } from "../src/lib/study";
import { validateWords } from "../scripts/target1900";

test("同梱のJSONに1900語の番号・意味・一意のIDが揃っている", () => {
  validateWords(dataset.words);
  assert.equal(new Set(dataset.words.map((word) => word.id)).size, 1900);
  assert.ok(dataset.words.every((word, index) => word.number === index + 1 && word.id.length > 0));
  assert.equal(dataset.words[0].word, "create");
  assert.equal(dataset.words[1899].word, "zealous");
});

test("各範囲をローカルデータから読み出し、10区分で全単語を一度ずつ取得する", () => {
  const allNumbers: number[] = [];
  for (const range of STUDY_RANGES) {
    const words = getStudyWords(range);
    assert.equal(words.length, range.count);
    assert.equal(words[0].number, range.start);
    assert.equal(words.at(-1)?.number, range.end);
    assert.ok(words.every((word) => word.meaning.length > 0));
    allNumbers.push(...words.map((word) => word.number));
  }
  assert.deepEqual(allNumbers, Array.from({ length: 1900 }, (_, i) => i + 1));
});
