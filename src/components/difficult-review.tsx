"use client";

import Link from "next/link";
import { useState } from "react";
import { selectDifficultWords } from "@/lib/difficult";
import type { StudyMode, StudyWord } from "@/lib/study";
import { useDifficultWords } from "./difficult-words-provider";
import { StudySession } from "./study-session";

function ReviewSession({ words, mode }: { words: StudyWord[]; mode: StudyMode }) {
  // 解除しても今の単語を飛ばさず、次の復習開始時に最新の登録を反映する。
  const [session, setSession] = useState(() => ({ words, revision: 0 }));
  if (session.words.length === 0) return <main className="message-page">
    <p>苦手単語はまだありません。</p><Link className="home-button" href="/">ホームに戻る</Link>
  </main>;
  return <StudySession key={session.revision} words={session.words} mode={mode} onRestart={() => {
    setSession((previous) => ({ words, revision: previous.revision + 1 }));
  }} />;
}

export function DifficultReview({ words, mode }: { words: StudyWord[]; mode: StudyMode }) {
  const { numbers, loaded, error, refresh } = useDifficultWords();
  if (!loaded) return <main className="message-page" aria-busy={!error}>
    <p role={error ? "alert" : undefined}>{error ?? "苦手単語を読み込んでいます…"}</p>
    {error && <button className="study-button" onClick={() => { void refresh(); }}>もう一度読み込む</button>}
    <Link className="home-button" href="/">ホームに戻る</Link>
  </main>;
  return <ReviewSession words={selectDifficultWords(words, numbers)} mode={mode} />;
}
