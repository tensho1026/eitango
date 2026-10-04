"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import { advanceStudy, INITIAL_STUDY_STATE, STUDY_RANGES, type StudyRange, type StudyWord } from "@/lib/study";

function Arrow({ down = false }: { down?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={down ? { transform: "rotate(90deg)" } : undefined}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function StudySession({ words, range }: { words: StudyWord[]; range: StudyRange }) {
  const router = useRouter();
  const [state, setState] = useState(INITIAL_STUDY_STATE);
  const [isPending, startTransition] = useTransition();
  const current = words[state.index];
  const progress = state.complete ? 100 : state.index / words.length * 100;
  const actionLabel = state.complete ? "もう一度学習する" : !state.revealed ? "意味を見る" : state.index + 1 === words.length ? "この範囲を完了" : "次の単語へ";

  return (
    <main className="study-main">
      <div className="intro">
        <p className="eyebrow"><span /> A LITTLE, EVERY DAY</p>
        <h1>今日も、ひとつずつ。</h1>
        <p className="intro-description">思い出して、確かめて、次へ。<br className="mobile-break" />自分のペースで英単語を身につけよう。</p>
      </div>
      <div className="study-layout" aria-busy={isPending}>
        <aside className="range-panel">
          <div className="panel-heading"><span className="eyebrow">YOUR SESSION</span><span className="section-number">{String(range.section).padStart(2, "0")} / 10</span></div>
          <label className="range-label" htmlFor="study-range">学習する範囲</label>
          <div className="select-wrap">
            <select id="study-range" value={range.start} disabled={isPending} onChange={(event) => {
              const start = event.target.value;
              startTransition(() => router.push(`/?start=${start}`, { scroll: false }));
            }}>
              {STUDY_RANGES.map((item) => <option key={item.start} value={item.start}>{item.start}〜{item.end} 番</option>)}
            </select>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <p className="range-count"><strong>{range.count}</strong> words<span>この範囲の単語数</span></p>
          <div className="range-divider" />
          <p className="instructions-title">ボタンひとつで、進めよう。</p>
          <ol className="instructions">
            <li><span>1</span>英単語を見て、意味を思い出す</li>
            <li><span>2</span>ボタンを押して、意味を確認</li>
            <li><span>3</span>もう一度押して、次の単語へ</li>
          </ol>
          <div className="small-note"><span aria-hidden="true">✳</span><p>少しずつの積み重ねが、<br />ちゃんと力になる。</p></div>
        </aside>
        <section className={`flashcard ${state.revealed ? "is-revealed" : ""}`} aria-label="英単語の学習">
          <div className="card-topline">
            <span className="card-mode"><span /> {state.complete ? "SESSION COMPLETE" : state.revealed ? "CHECK THE MEANING" : "RECALL THE MEANING"}</span>
            <span className="word-counter">{state.complete ? words.length : state.index + 1}<span> / {words.length}</span></span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="学習の進み具合" aria-valuemin={0} aria-valuemax={words.length} aria-valuenow={state.complete ? words.length : state.index}>
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="card-content" id="word-content" aria-live="polite" aria-atomic="true">
            {isPending ? <div className="pending-message"><span className="loading-dot" />単語を読み込んでいます…</div> : state.complete ? <div className="completion">
              <div className="completion-check" aria-hidden="true">✓</div>
              <p className="eyebrow">WELL DONE</p>
              <h2>この範囲を学習しました。</h2>
              <p>{range.start}〜{range.end}番、{words.length}語。おつかれさまでした。</p>
            </div> : <>
              <p className="word-number">WORD {String(current.number).padStart(4, "0")}</p>
              <h2 className="english-word" lang="en" style={{ "--word-length": current.word.length } as CSSProperties}>{current.word}</h2>
              <div className="meaning-area">
                {state.revealed ? <div className="meaning-reveal"><span className="meaning-label">MEANING</span><p>{current.meaning}</p></div> : <p className="meaning-hint"><span aria-hidden="true">···</span>どんな意味だったかな？</p>}
              </div>
            </>}
          </div>
          <div className="card-bottom">
            <button type="button" className="study-button" disabled={isPending} aria-controls="word-content" onClick={() => setState((previous) => advanceStudy(previous, words.length))}>
              <span>{actionLabel}</span><Arrow down={!state.revealed && !state.complete} />
            </button>
            <p className="button-caption">{state.complete ? "同じ範囲を復習するか、別の範囲を選べます" : state.revealed ? "確認できたら、次の単語に進みましょう" : "まずは意味を思い浮かべてから、答え合わせ"}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
