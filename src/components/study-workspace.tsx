"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createLearningSession, getSessionKey, type LearningConfig } from "@/lib/learning";
import type { StudyState, StudyWord } from "@/lib/study";
import { useLearningProgress } from "./learning-progress-provider";
import { StudySession } from "./study-session";

function ActiveSession({ words, config }: { words: StudyWord[]; config: LearningConfig }) {
  const { entries, save, remove } = useLearningProgress();
  const [run, setRun] = useState(() => ({ ...createLearningSession(words, config, entries.find(entry => getSessionKey(entry.config) === getSessionKey(config))), revision: 0 }));
  const onProgress = useCallback((state: StudyState, answer: string) => {
    if (state.complete) { remove(getSessionKey(config)); return; }
    save({ config, order: run.words.map(word => word.number), state, answer, updatedAt: Date.now() });
  }, [config, run.words, save, remove]);

  if (!run.words.length) return <main className="message-page"><p>苦手単語はまだありません。</p><Link className="home-button" href="/">ホームに戻る</Link></main>;
  return <StudySession key={run.revision} words={run.words} config={config} initialState={run.state} initialAnswer={run.answer} onProgress={onProgress}
    onRestart={() => { remove(getSessionKey(config)); setRun(previous => ({ ...createLearningSession(words, config), revision: previous.revision + 1 })); }} />;
}

export function StudyWorkspace({ words, config }: { words: StudyWord[]; config: LearningConfig }) {
  const { ready } = useLearningProgress();
  if (!ready) return <main className="message-page" aria-busy="true"><p>読み込み中…</p></main>;
  return <ActiveSession words={words} config={config} />;
}
