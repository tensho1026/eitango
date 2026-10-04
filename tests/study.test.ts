import assert from "node:assert/strict";
import test from "node:test";
import { advanceStudy, advanceAutoStudy, getRange, getStudyMode, getInitialStudyState, INITIAL_STUDY_STATE, STUDY_RANGES } from "../src/lib/study";

test("1900語を、200語ずつ9区分と最後の100語に分ける", () => {
  assert.equal(STUDY_RANGES.length, 10);
  assert.deepEqual(STUDY_RANGES.map((range) => range.count), [...Array(9).fill(200), 100]);
  assert.equal(STUDY_RANGES.reduce((total, range) => total + range.count, 0), 1900);
  assert.equal(STUDY_RANGES[9].start, 1801);
  assert.equal(STUDY_RANGES[9].end, 1900);
  for (let i = 1; i < STUDY_RANGES.length; i++) assert.equal(STUDY_RANGES[i].start, STUDY_RANGES[i - 1].end + 1);
});

test("URLの範囲指定を検証し、不正値は最初の範囲に戻す", () => {
  assert.equal(getRange("201").start, 201);
  assert.equal(getRange("1801").count, 100);
  for (const value of [undefined, "0", "1901", "2", "0201", "201;DROP", ["201", "401"]]) assert.equal(getRange(value).start, 1);
});

test("同じボタンで意味表示→次の単語を繰り返し、最後に完了→再学習する", () => {
  for (const total of [200, 100]) {
    let state = { ...INITIAL_STUDY_STATE };
    for (let index = 0; index < total; index++) {
      assert.equal(state.index, index);
      assert.equal(state.revealed, false);
      state = advanceStudy(state, total);
      assert.equal(state.index, index);
      assert.equal(state.revealed, true);
      assert.equal(state.complete, false);
      state = advanceStudy(state, total);
    }
    assert.equal(state.complete, true);
    assert.equal(state.index, total - 1);
    assert.deepEqual(advanceStudy(state, total), INITIAL_STUDY_STATE);
  }
});

test("自動モードだけを受け付け、未指定・不正値は通常モードに戻す", () => {
  assert.equal(getStudyMode("auto"), "auto");
  for (const value of [undefined, "manual", "AUTO", "unknown", ["auto", "manual"]]) {
    assert.equal(getStudyMode(value), "manual");
  }
  assert.deepEqual(getInitialStudyState("manual"), INITIAL_STUDY_STATE);
});

test("自動モードは最初から意味を表示し、全単語を一度ずつ進んで完了後は停止する", () => {
  for (const total of [200, 100]) {
    let state = getInitialStudyState("auto");
    const visited: number[] = [];
    for (let index = 0; index < total; index++) {
      assert.equal(state.index, index);
      assert.equal(state.revealed, true);
      assert.equal(state.complete, false);
      visited.push(state.index);
      state = advanceAutoStudy(state, total);
    }
    assert.deepEqual(visited, Array.from({ length: total }, (_, index) => index));
    assert.equal(state.complete, true);
    assert.equal(state.index, total - 1);
    assert.equal(advanceAutoStudy(state, total), state);
    const restarted = getInitialStudyState("auto");
    assert.deepEqual(restarted, { index: 0, revealed: true, complete: false });
  }
});
