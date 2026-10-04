"use client";

import Link from "next/link";
import { useState } from "react";
import { STUDY_RANGES, type StudyMode } from "@/lib/study";

export function HomeMenu() {
  const [mode, setMode] = useState<StudyMode>("manual");

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
