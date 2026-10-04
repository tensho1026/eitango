import { TOTAL_WORDS, type StudyWord } from "./study";

export function isWordNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= TOTAL_WORDS;
}

export function readDifficultPayload(value: unknown): { number: number; saved: boolean } | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  return isWordNumber(payload.number) && typeof payload.saved === "boolean"
    ? { number: payload.number, saved: payload.saved } : null;
}

export function isLearnerId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function selectDifficultWords(words: StudyWord[], numbers: number[]): StudyWord[] {
  const selected = new Set(numbers.filter(isWordNumber));
  return words.filter((word) => selected.has(word.number));
}
