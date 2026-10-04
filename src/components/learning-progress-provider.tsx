"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSessionKey, parseProgress, PROGRESS_STORAGE_KEY, type ProgressEntry } from "@/lib/learning";

type ProgressContext = { ready: boolean; entries: ProgressEntry[]; save: (entry: ProgressEntry) => void; remove: (key: string) => void };
const Context = createContext<ProgressContext | null>(null);

export function LearningProgressProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const latest = useRef<ProgressEntry[]>([]);

  const update = useCallback((next: ProgressEntry[]) => {
    latest.current = next; setEntries(next);
    try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next)); } catch { /* 保存不可でも学習は継続する。 */ }
  }, []);
  const save = useCallback((entry: ProgressEntry) => {
    update([entry, ...latest.current.filter(item => getSessionKey(item.config) !== getSessionKey(entry.config))].slice(0, 30));
  }, [update]);
  const remove = useCallback((key: string) => {
    if (latest.current.some(entry => getSessionKey(entry.config) === key)) update(latest.current.filter(entry => getSessionKey(entry.config) !== key));
  }, [update]);

  useEffect(() => {
    let active = true;
    const read = () => {
      if (!active) return;
      let next: ProgressEntry[] = [];
      try { next = parseProgress(localStorage.getItem(PROGRESS_STORAGE_KEY)); } catch { /* 保存が制限されているブラウザ。 */ }
      latest.current = next; setEntries(next); setReady(true);
    };
    queueMicrotask(read);
    const onStorage = (event: StorageEvent) => { if (event.key === PROGRESS_STORAGE_KEY || event.key === null) read(); };
    window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("storage", onStorage); };
  }, []);

  return <Context.Provider value={{ ready, entries, save, remove }}>{children}</Context.Provider>;
}

export function useLearningProgress() {
  const context = useContext(Context);
  if (!context) throw new Error("LearningProgressProviderが必要です。");
  return context;
}
