import assert from "node:assert/strict";
import test from "node:test";
import { createLearningSession, getLearningConfig, getLearningHref, getSessionKey, getSwipeDirection, matchesSpelling, moveStudy, parseProgress, shuffleWords, type LearningConfig, type ProgressEntry } from "../src/lib/learning";
import { selectDifficultWords } from "../src/lib/difficult";
import { getAllStudyWords } from "../src/lib/words";

const words = getAllStudyWords();
const config: LearningConfig = { scope: "range", start: 1, mode: "manual", exercise: "english", shuffle: true };
const saved: ProgressEntry = { config, order: [4, 2, 1, 3, 5], state: { index: 2, revealed: true, complete: false }, answer: "create", updatedAt: 1 };

test("シャッフルは1900語を重複・欠落なく並べ替え、元データを変更しない", () => {
  const original = [...words];
  const shuffled = shuffleWords(words, () => .37);
  assert.deepEqual(words, original);
  assert.notDeepEqual(shuffled, original);
  assert.equal(shuffled.length, 1900);
  assert.equal(new Set(shuffled.map(word => word.number)).size, 1900);
  assert.deepEqual(shuffled.map(word => word.number).sort((a, b) => a - b), words.map(word => word.number));
  assert.deepEqual(shuffleWords([]), []);
});

test("保存を読み直すとシャッフル順・単語・表示状態・入力内容を復元する", () => {
  const entries = parseProgress(JSON.stringify([saved]));
  const restored = createLearningSession(words.slice(0, 5), config, entries[0]);
  assert.deepEqual(restored.words.map(word => word.number), saved.order);
  assert.equal(restored.words[restored.state.index].number, 1);
  assert.deepEqual(restored.state, saved.state);
  assert.equal(restored.answer, "create");
  const other = { ...config, exercise: "japanese" as const };
  assert.notEqual(getSessionKey(other), getSessionKey(config));
  assert.equal(createLearningSession(words.slice(0, 5), other, saved).state.index, 0);
});

test("復習再開時は卒業した単語を除き、次の登録単語へ移動する", () => {
  const review = { ...config, scope: "review" as const, start: undefined };
  const restored = createLearningSession([words[1], words[2], words[4], words[200]], review, { ...saved, config: review });
  assert.deepEqual(restored.words.map(word => word.number), [2, 3, 5, 201]);
  assert.equal(restored.words[restored.state.index].number, 3);
  assert.equal(restored.state.revealed, false);
  assert.equal(restored.answer, "");
  assert.deepEqual(createLearningSession([], review, { ...saved, config: review }).words, []);
  const ordered = { ...review, shuffle: false };
  const orderedRun = createLearningSession([words[0], words[200]], ordered, {
    ...saved, config: ordered, order: [201], state: { index: 0, revealed: false, complete: false },
  });
  assert.deepEqual(orderedRun.words.map(word => word.number), [1, 201]);
  assert.equal(orderedRun.words[orderedRun.state.index].number, 201);
});

test("破損した保存・不正な範囲や位置・重複した単語番号を拒否する", () => {
  for (const value of [null, "broken", "{}", "[null]"]) assert.deepEqual(parseProgress(value), []);
  for (const entry of [
    { ...saved, order: [1, 1] }, { ...saved, order: [1901] },
    { ...saved, state: { ...saved.state, index: 5 } }, { ...saved, state: { ...saved.state, complete: true } },
    { ...saved, config: { ...config, start: 201 } }, { ...saved, config: { ...config, mode: "invalid" } },
    { ...saved, config: { ...config, scope: "other" } }, { ...saved, config: { ...config, exercise: "spelling", mode: "auto2" } },
  ]) assert.deepEqual(parseProgress(JSON.stringify([entry])), []);
});

test("学習設定をURLに引き継ぎ、スペル入力では自動切り替えを無効にする", () => {
  const review = getLearningConfig("review", { start: "201", mode: "auto2", exercise: "japanese", shuffle: "1" });
  assert.equal(getLearningHref(review), "/review?start=201&mode=auto2&exercise=japanese&shuffle=1");
  assert.equal(getLearningConfig("range", { mode: "auto", exercise: "spelling" }).mode, "manual");
  assert.equal(getLearningConfig("range", { start: "invalid" }).start, 1);
  assert.equal(getLearningConfig("review", { start: "invalid" }).start, undefined);
});

test("範囲別復習は区切りの境界と最後の100語を正しく絞り込む", () => {
  const selected = [1, 200, 201, 400, 401, 1800, 1801, 1900];
  assert.deepEqual(selectDifficultWords(words, selected, 201).map(word => word.number), [201, 400]);
  assert.deepEqual(selectDifficultWords(words, selected, 1801).map(word => word.number), [1801, 1900]);
  assert.equal(selectDifficultWords(words, selected).length, selected.length);
});

test("水平スワイプだけを受け付け、端の単語を越えずに前後へ移動する", () => {
  assert.equal(getSwipeDirection(-80, 10), "next");
  assert.equal(getSwipeDirection(80, -10), "previous");
  assert.equal(getSwipeDirection(20, 0), null);
  assert.equal(getSwipeDirection(80, 100), null);
  const first = { index: 0, revealed: true, complete: false };
  assert.equal(moveStudy(first, "previous", 2, "manual"), first);
  const second = moveStudy(first, "next", 2, "manual");
  assert.deepEqual(second, { index: 1, revealed: false, complete: false });
  assert.deepEqual(moveStudy(second, "previous", 2, "auto2"), { index: 0, revealed: true, complete: false });
  const complete = moveStudy(second, "next", 2, "manual");
  assert.equal(complete.complete, true);
  assert.deepEqual(moveStudy(complete, "previous", 2, "manual"), second);
  assert.equal(moveStudy(complete, "next", 2, "manual"), complete);
});

test("スペル判定は大文字・前後の空白・全角英字を許容し、誤字を拒否する", () => {
  assert.equal(matchesSpelling(" CREATE ", "create"), true);
  assert.equal(matchesSpelling("ｃｒｅａｔｅ", "create"), true);
  assert.equal(matchesSpelling("can't", "can’t"), true);
  for (const answer of ["", " ", "creat", "craete", "c r e a t e"]) assert.equal(matchesSpelling(answer, "create"), false);
});
