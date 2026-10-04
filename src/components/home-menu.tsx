"use client";

import Link from "next/link";
import { useState } from "react";
import { STUDY_RANGES, type StudyMode } from "@/lib/study";
import { useDifficultWords } from "./difficult-words-provider";

export function HomeMenu() {
  const [mode, setMode] = useState<StudyMode>("manual");
  const { numbers, loaded, error, refresh } = useDifficultWords();

  return (
    <main className="home-screen">
      <h1>ターゲット1900</h1>
      <fieldset className="mode-selector">
        <legend>学習モード</legend>
        <div className="mode-options">
          <label className="mode-option">
            <input type="radio" name="study-mode" value="manual" checked={mode === "manual"} onChange={() => setMode("manual")} />
            通常
          </label>
          <label className="mode-option">
            <input type="radio" name="study-mode" value="auto" checked={mode === "auto"} onChange={() => setMode("auto")} />
            自動（3秒）
          </label>
        </div>
      </fieldset>
      <div className="review-entry">
        {loaded && numbers.length > 0 ? <Link className="review-option" href={`/review${mode === "auto" ? "?mode=auto" : ""}`} prefetch={false}>
          苦手単語だけ復習<span>{numbers.length}語</span>
        </Link> : <button className="review-option" disabled>苦手単語だけ復習<span>{loaded ? "0語" : "…"}</span></button>}
        {loaded && numbers.length === 0 && <p className="review-hint">学習画面の☆で登録できます。</p>}
        {error && <p className="review-error" role="alert">{error}<button onClick={() => { void refresh(); }}>再試行</button></p>}
      </div>
      <h2>学習する範囲</h2>
      <nav className="range-grid" aria-label="学習する範囲">
        {STUDY_RANGES.map((range) => (
          <Link className="range-option" href={`/study?start=${range.start}${mode === "auto" ? "&mode=auto" : ""}`} key={range.start}>
            {range.start}〜{range.end}番
          </Link>
        ))}
      </nav>
    </main>
  );
}
