"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { advanceStudy, INITIAL_STUDY_STATE, type StudyWord } from "@/lib/study";

export function StudySession({ words }: { words: StudyWord[] }) {
  const [state, setState] = useState(INITIAL_STUDY_STATE);
  const current = words[state.index];
  const actionLabel = state.complete ? "もう一度学習する" : !state.revealed ? "意味を見る" : state.index + 1 === words.length ? "完了する" : "次の単語へ";

  return (
    <main className="study-screen" aria-label="英単語の学習">
      <div className="study-content" id="word-content" aria-live="polite" aria-atomic="true">
        {state.complete ? <h1 className="completion-title">完了</h1> : <>
          <h1 className="english-word" lang="en" style={{ "--word-length": current.word.length } as CSSProperties}>{current.word}</h1>
          <div className="meaning-area">
            {state.revealed && <p className="meaning">{current.meaning}</p>}
          </div>
        </>}
      </div>
      <div className="study-controls">
        <button type="button" className="study-button" aria-controls="word-content" onClick={() => setState((previous) => advanceStudy(previous, words.length))}>
          {actionLabel}
        </button>
        <Link className="home-button" href="/">ホームに戻る</Link>
      </div>
    </main>
  );
}
