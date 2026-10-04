"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { isWordNumber } from "@/lib/difficult";

type DifficultContext = {
  numbers: number[]; loaded: boolean; pendingNumber: number | null; error: string | null;
  refresh: (signal?: AbortSignal) => Promise<void>;
  setSaved: (number: number, saved: boolean) => Promise<boolean>;
};
const Context = createContext<DifficultContext | null>(null);

async function readResponse(response: Response): Promise<number[]> {
  if (!response.ok) throw new Error("Request failed");
  const data = await response.json();
  if (!Array.isArray(data.numbers) || !data.numbers.every(isWordNumber)) throw new Error("Invalid response");
  return [...new Set<number>(data.numbers)].sort((a, b) => a - b);
}

export function DifficultWordsProvider({ children }: { children: React.ReactNode }) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingNumber, setPendingNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const saving = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (saving.current || signal?.aborted) return;
    const version = ++sequence.current;
    try {
      const result = await readResponse(await fetch("/api/difficult", { cache: "no-store", credentials: "same-origin", signal }));
      if (version !== sequence.current || signal?.aborted) return;
      setNumbers(result); setLoaded(true); setError(null);
    } catch {
      if (version === sequence.current && !signal?.aborted) setError("苦手単語を読み込めませんでした。");
    }
  }, []);

  const setSaved = useCallback(async (number: number, saved: boolean) => {
    if (saving.current || !isWordNumber(number)) return false;
    saving.current = true;
    ++sequence.current;
    setPendingNumber(number); setError(null);
    try {
      const result = await readResponse(await fetch("/api/difficult", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, saved }),
      }));
      setNumbers(result); setLoaded(true);
      return true;
    } catch {
      setError("苦手単語の登録を保存できませんでした。");
      return false;
    } finally {
      saving.current = false; setPendingNumber(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { void refresh(controller.signal); });
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  return <Context.Provider value={{ numbers, loaded, pendingNumber, error, refresh, setSaved }}>{children}</Context.Provider>;
}

export function useDifficultWords() {
  const context = useContext(Context);
  if (!context) throw new Error("DifficultWordsProviderが必要です。");
  return context;
}
