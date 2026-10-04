"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { advanceStudy, advanceAutoStudy, AUTO_ADVANCE_MS, getInitialStudyState, type StudyMode, type StudyWord } from "@/lib/study";
import { splitMeaning } from "@/lib/meaning";
import { useDifficultWords } from "./difficult-words-provider";

export function StudySession({ words, mode, onRestart }: { words: StudyWord[]; mode: StudyMode; onRestart?: () => void }) {
  const [state, setState] = useState(() => getInitialStudyState(mode));
  const current = words[state.index];
  const { numbers, loaded, pendingNumber, error, setSaved } = useDifficultWords();
  const saved = numbers.includes(current.number);
  const actionLabel = state.complete ? "もう一度学習する" : !state.revealed ? "意味を見る" : state.index + 1 === words.length ? "完了する" : "次の単語へ";

  useEffect(() => {
    if (mode !== "auto" || state.complete) return;
    const timer = window.setTimeout(() => {
      setState((previous) => advanceAutoStudy(previous, words.length));
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [mode, state.index, state.complete, words.length]);

  return (
    <>
      <Link className="home-link" href="/" aria-label="ホームに戻る" title="ホームに戻る">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      {!state.complete && <button className={`difficult-button${saved ? " is-saved" : ""}`} type="button"
        aria-label={saved ? "苦手単語から解除" : "苦手単語に登録"} title={saved ? "苦手単語から解除" : "苦手単語に登録"}
        aria-pressed={saved} disabled={!loaded || pendingNumber !== null} onClick={() => { void setSaved(current.number, !saved); }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} aria-hidden="true">
          <path d="m12 3 2.78 5.63 6.22.91-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93L7.5 13.93 3 9.54l6.22-.91L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </button>}
      {error && <p className="difficult-error" role="alert">{error}</p>}
      <main className={`study-screen${mode === "auto" && !state.complete ? " is-auto" : ""}`} aria-label="英単語の学習">
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
        {(mode === "manual" || state.complete) && <div className="study-controls">
          <button type="button" className="study-button" aria-controls="word-content" onClick={() => {
            if (state.complete && onRestart) { onRestart(); return; }
            setState((previous) => previous.complete ? getInitialStudyState(mode) : advanceStudy(previous, words.length));
          }}>
            {actionLabel}
          </button>
        </div>}
      </main>
    </>
  );
}
