"use client";

import Link from "next/link";
import { selectDifficultWords } from "@/lib/difficult";
import type { StudyWord } from "@/lib/study";
import type { LearningConfig } from "@/lib/learning";
import { useDifficultWords } from "./difficult-words-provider";
import { StudyWorkspace } from "./study-workspace";

export function DifficultReview({ words, config }: { words: StudyWord[]; config: LearningConfig }) {
  const { numbers, loaded, error, refresh } = useDifficultWords();
  if (!loaded) return <main className="message-page" aria-busy={!error}>
    <p role={error ? "alert" : undefined}>{error ?? "苦手単語を読み込んでいます…"}</p>
    {error && <button className="study-button" onClick={() => { void refresh(); }}>もう一度読み込む</button>}
    <Link className="home-button" href="/">ホームに戻る</Link>
  </main>;
  const selected = selectDifficultWords(words, numbers, config.start);
  return <StudyWorkspace words={selected} config={config} />;
}
