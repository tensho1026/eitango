"use client";

import Link from "next/link";
import { useState } from "react";
import { selectDifficultWords } from "@/lib/difficult";
import { getLearningHref, type LearningConfig } from "@/lib/learning";
import { splitMeaning } from "@/lib/meaning";
import { STUDY_RANGES, type StudyWord } from "@/lib/study";
import { useDifficultWords } from "./difficult-words-provider";

export function DifficultList({ words, config }: { words: StudyWord[]; config: LearningConfig }) {
  const [start, setStart] = useState(config.start);
  const { numbers, loaded, pendingNumber, error, refresh, setSaved } = useDifficultWords();
  const selected = selectDifficultWords(words, numbers, start);
  return <>
    <Link className="home-link" href="/" aria-label="ホームに戻る"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg></Link>
    <main className="list-screen">
      <h1>苦手単語の一覧</h1>
      <label className="setting-field">苦手単語の範囲<select value={start ?? "all"} onChange={event => setStart(event.target.value === "all" ? undefined : Number(event.target.value))}>
        <option value="all">すべて</option>{STUDY_RANGES.map(range => <option key={range.start} value={range.start}>{range.start}〜{range.end}番</option>)}
      </select></label>
      <p className="list-count">{loaded ? `${selected.length}語` : "読み込み中…"}</p>
      {error && <p className="review-error" role="alert">{error}<button onClick={() => { void refresh(); }}>再試行</button></p>}
      {loaded && selected.length > 0 ? <>
        <Link className="study-button" href={getLearningHref({ ...config, start })} prefetch={false}>この範囲を復習</Link>
        <ul className="difficult-list">{selected.map(word => <li key={word.id}>
          <div><span className="word-number">{word.number}番</span><h2 lang="en">{word.word}</h2>
            {splitMeaning(word.meaning).map((meaning, index) => <p className="list-meaning" key={index}>{meaning}</p>)}
          </div>
          <button className="remove-word" type="button" aria-label={`${word.word}を苦手単語から解除`} disabled={pendingNumber !== null}
            onClick={() => { void setSaved(word.number, false); }}>{pendingNumber === word.number ? "保存中…" : "解除"}</button>
        </li>)}</ul>
      </> : loaded && <p className="empty-list">{numbers.length ? "この範囲の苦手単語はありません。" : "学習画面の☆で苦手単語を登録できます。"}</p>}
    </main>
  </>;
}
