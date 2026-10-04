"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { advanceStudy, INITIAL_STUDY_STATE, type StudyWord } from "@/lib/study";
import { splitMeaning } from "@/lib/meaning";

export function StudySession({ words }: { words: StudyWord[] }) {
  const [state, setState] = useState(INITIAL_STUDY_STATE);
  const current = words[state.index];
  const actionLabel = state.complete ? "もう一度学習する" : !state.revealed ? "意味を見る" : state.index + 1 === words.length ? "完了する" : "次の単語へ";

  return (
    <>
      <Link className="home-link" href="/" aria-label="ホームに戻る" title="ホームに戻る">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <main className="study-screen" aria-label="英単語の学習">
        <div className="study-content" id="word-content" aria-live="polite" aria-atomic="true">
          {state.complete ? <h1 className="completion-title">完了</h1> : <>
            <h1 className="english-word" lang="en" style={{ "--word-length": current.word.length } as CSSProperties}>{current.word}</h1>
            <div className="meaning-area">
              {state.revealed && splitMeaning(current.meaning).map((meaning, index) => (
                <p className="meaning" key={`${current.id}-${index}`}>{meaning}</p>
              ))}
            </div>
          </>}
        </div>
        <div className="study-controls">
          <button type="button" className="study-button" aria-controls="word-content" onClick={() => setState((previous) => advanceStudy(previous, words.length))}>
            {actionLabel}
          </button>
        </div>
      </main>
    </>
  );
}
