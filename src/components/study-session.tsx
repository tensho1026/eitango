"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { advanceStudy, advanceAutoStudy, getAutoAdvanceMs, type StudyState, type StudyWord } from "@/lib/study";
import { getSwipeDirection, matchesSpelling, moveStudy, type LearningConfig } from "@/lib/learning";
import { splitMeaning } from "@/lib/meaning";
import { useDifficultWords } from "./difficult-words-provider";

type Props = {
  words: StudyWord[]; config: LearningConfig; initialState: StudyState; initialAnswer: string;
  onProgress: (state: StudyState, answer: string) => void; onRestart: () => void;
};

export function StudySession({ words, config, initialState, initialAnswer, onProgress, onRestart }: Props) {
  const [state, setState] = useState(initialState);
  const [answer, setAnswer] = useState(initialAnswer);
  const [inputError, setInputError] = useState("");
  const [graduating, setGraduating] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const current = words[state.index];
  const { numbers, loaded, pendingNumber, error, setSaved } = useDifficultWords();
  const saved = numbers.includes(current.number);
  const autoAdvanceMs = getAutoAdvanceMs(config.mode);
  const spelling = config.exercise === "spelling";
  const reverse = config.exercise !== "english";
  const busy = pendingNumber !== null || graduating;
  const graduateAvailable = config.scope === "review" && saved && !state.complete;
  const actionLabel = state.complete ? "もう一度学習する" : !state.revealed
    ? spelling ? "答え合わせ" : reverse ? "英単語を見る" : "意味を見る"
    : state.index + 1 === words.length ? "完了する" : "次の単語へ";

  useEffect(() => { onProgress(state, answer); }, [state, answer, onProgress]);
  useEffect(() => {
    const onHide = () => { setHidden(document.hidden); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
  useEffect(() => {
    if (autoAdvanceMs === null || state.complete || hidden || busy) return;
    const timer = window.setTimeout(() => { setState(previous => advanceAutoStudy(previous, words.length)); }, autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceMs, state.index, state.complete, hidden, busy, words.length]);

  function move(direction: "next" | "previous") {
    if (busy) return;
    const next = moveStudy(state, direction, words.length, config.mode);
    if (next === state) return;
    setAnswer(""); setInputError(""); setState(next);
  }

  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0 || busy) return;
    if (event.target instanceof Element && event.target.closest("button,a,input,select,textarea,label")) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerUp(event: PointerEvent<HTMLElement>) {
    const start = gesture.current; gesture.current = null;
    if (!start || event.pointerId !== start.id) return;
    const direction = getSwipeDirection(event.clientX - start.x, event.clientY - start.y);
    if (direction) move(direction);
  }

  function action() {
    if (busy) return;
    if (state.complete) { onRestart(); return; }
    if (spelling && !state.revealed) {
      if (!answer.trim()) { setInputError("英単語を入力してください。"); return; }
      setInputError(""); setState(previous => ({ ...previous, revealed: true })); return;
    }
    if (state.revealed) { setAnswer(""); setInputError(""); }
    setState(previous => advanceStudy(previous, words.length));
  }

  async function graduate() {
    if (busy || !graduateAvailable) return;
    setGraduating(true);
    try {
      if (await setSaved(current.number, false)) {
        setAnswer(""); setInputError(""); setState(previous => moveStudy(previous, "next", words.length, config.mode));
      }
    } finally { setGraduating(false); }
  }

  return <>
    <Link className="home-link" href="/" aria-label="ホームに戻る" title="ホームに戻る">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
    {!state.complete && <button className={`difficult-button${saved ? " is-saved" : ""}`} type="button"
      aria-label={saved ? "苦手単語から解除" : "苦手単語に登録"} title={saved ? "苦手単語から解除" : "苦手単語に登録"}
      aria-pressed={saved} disabled={!loaded || busy} onClick={() => { void setSaved(current.number, !saved); }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} aria-hidden="true">
        <path d="m12 3 2.78 5.63 6.22.91-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93L7.5 13.93 3 9.54l6.22-.91L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    </button>}
    {error && <p className="difficult-error" role="alert">{error}</p>}
    <main className={`study-screen${autoAdvanceMs !== null && !state.complete ? " is-auto" : ""}${spelling ? " is-spelling" : ""}`}
      aria-label="英単語の学習" onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; }}>
      <div className="study-content" id="word-content" aria-live="polite" aria-atomic="true">
        {state.complete ? <h1 className="completion-title">完了</h1> : <>
          {reverse ? <h1 className="meaning-question">{splitMeaning(current.meaning).map((meaning, index) => <span key={index}>{meaning}</span>)}</h1>
            : <h1 className="english-word" lang="en" style={{ "--word-length": current.word.length } as CSSProperties}>{current.word}</h1>}
          <div className="meaning-area">
            {state.revealed && (reverse ? <p className="english-answer" lang="en" style={{ "--word-length": current.word.length } as CSSProperties}>{current.word}</p>
              : splitMeaning(current.meaning).map((meaning, index) => <p className="meaning" key={`${current.id}-${index}`}>{meaning}</p>))}
            {spelling && state.revealed && <p className={`spelling-result${matchesSpelling(answer, current.word) ? " is-correct" : ""}`}>
              {matchesSpelling(answer, current.word) ? "正解" : "正しいスペルを確認しましょう"}
            </p>}
          </div>
        </>}
      </div>
      {(config.mode === "manual" || state.complete || graduateAvailable) && <div className="study-controls">
        {(config.mode === "manual" || state.complete) && <form onSubmit={event => { event.preventDefault(); action(); }}>
          {spelling && !state.complete && <>
            <label className="sr-only" htmlFor="spelling-answer">英単語を入力</label>
            <input id="spelling-answer" className="spelling-input" lang="en" type="text" inputMode="text" autoComplete="off" autoCapitalize="none"
              spellCheck={false} maxLength={200} required readOnly={state.revealed} placeholder="英単語を入力" value={answer}
              onChange={event => { setAnswer(event.target.value); setInputError(""); }} aria-invalid={Boolean(inputError)} aria-describedby={inputError ? "spelling-error" : undefined} />
            {inputError && <p className="input-error" id="spelling-error" role="alert">{inputError}</p>}
          </>}
          <button type="submit" className="study-button" disabled={busy} aria-controls="word-content">{actionLabel}</button>
        </form>}
        {graduateAvailable && <button type="button" className="graduate-button" disabled={busy || !loaded} onClick={() => { void graduate(); }}
          aria-label="覚えたので苦手単語から外す">{graduating ? "保存中…" : "覚えた"}</button>}
      </div>}
    </main>
  </>;
}
