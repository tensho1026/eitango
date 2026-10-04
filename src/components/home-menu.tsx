"use client";

import Link from "next/link";
import { useState } from "react";
import { STUDY_RANGES, type StudyMode } from "@/lib/study";
import { getLearningHref, getSessionKey, getSessionLabel, type Exercise, type LearningConfig } from "@/lib/learning";
import { useDifficultWords } from "./difficult-words-provider";
import { useLearningProgress } from "./learning-progress-provider";

export function HomeMenu() {
  const [mode, setMode] = useState<StudyMode>("manual");
  const [exercise, setExercise] = useState<Exercise>("english");
  const [shuffle, setShuffle] = useState(false);
  const [reviewStart, setReviewStart] = useState<number | undefined>();
  const { numbers, loaded, error, refresh } = useDifficultWords();
  const { entries, remove } = useLearningProgress();
  const resume = entries.find(entry => entry.config.scope === "range" || (loaded && entry.order.some(number => numbers.includes(number))));
  const count = numbers.filter(number => reviewStart === undefined || (number >= reviewStart && number < reviewStart + 200)).length;
  const reviewConfig: LearningConfig = { scope: "review", start: reviewStart, mode, exercise, shuffle };
  const listHref = getLearningHref(reviewConfig).replace("/review", "/difficult");

  return <main className="home-screen">
    <h1>ターゲット1900</h1>
    {resume && <div className="resume-entry"><Link className="resume-option" href={getLearningHref(resume.config)} prefetch={false}>
      <strong>続きから再開</strong><span>{getSessionLabel(resume.config)}</span><span>{resume.order[resume.state.index]}番から</span>
    </Link><button type="button" className="reset-progress" onClick={() => remove(getSessionKey(resume.config))}>再開位置をリセット</button></div>}
    <fieldset className="mode-selector">
      <legend>学習モード</legend>
      <div className="mode-options">
        {([{ value: "manual", label: "通常" }, { value: "auto2", label: "自動（2秒）" }, { value: "auto", label: "自動（3秒）" }] as const).map(option =>
          <label className="mode-option" key={option.value}>
            <input type="radio" name="study-mode" value={option.value} checked={mode === option.value} disabled={exercise === "spelling" && option.value !== "manual"}
              onChange={() => setMode(option.value)} />{option.label}
          </label>)}
      </div>
    </fieldset>
    <div className="learning-settings">
      <label className="setting-field">学習方法<select value={exercise} onChange={event => {
        const next = event.target.value as Exercise; setExercise(next); if (next === "spelling") setMode("manual");
      }}><option value="english">英語→日本語</option><option value="japanese">日本語→英語</option><option value="spelling">スペル入力テスト</option></select></label>
      <label className="shuffle-setting"><input type="checkbox" checked={shuffle} onChange={event => setShuffle(event.target.checked)} />シャッフル</label>
    </div>
    <div className="review-entry">
      <label className="setting-field">苦手単語の範囲<select value={reviewStart ?? "all"} onChange={event => setReviewStart(event.target.value === "all" ? undefined : Number(event.target.value))}>
        <option value="all">すべて</option>{STUDY_RANGES.map(range => <option key={range.start} value={range.start}>{range.start}〜{range.end}番</option>)}
      </select></label>
      {loaded && count > 0 ? <Link className="review-option" href={getLearningHref(reviewConfig)} prefetch={false}>
        苦手単語だけ復習<span>{count}語</span>
      </Link> : <button className="review-option" disabled>苦手単語だけ復習<span>{loaded ? "0語" : "…"}</span></button>}
      <Link className="list-link" href={listHref} prefetch={false}>苦手単語の一覧</Link>
      {loaded && numbers.length === 0 && <p className="review-hint">学習画面の☆で登録できます。</p>}
      {error && <p className="review-error" role="alert">{error}<button onClick={() => { void refresh(); }}>再試行</button></p>}
    </div>
    <h2>学習する範囲</h2>
    <nav className="range-grid" aria-label="学習する範囲">{STUDY_RANGES.map(range =>
      <Link className="range-option" href={getLearningHref({ scope: "range", start: range.start, mode, exercise, shuffle })} key={range.start}>
        {range.start}〜{range.end}番
      </Link>)}</nav>
  </main>;
}
