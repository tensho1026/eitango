import { getInitialStudyState, getStudyMode, STUDY_RANGES, type StudyMode, type StudyState, type StudyWord } from "./study";

export type Exercise = "english" | "japanese" | "spelling";
export type LearningConfig = { scope: "range" | "review"; start?: number; mode: StudyMode; exercise: Exercise; shuffle: boolean };
export type LearningParams = { start?: string | string[]; mode?: string | string[]; exercise?: string | string[]; shuffle?: string | string[] };
export type ProgressEntry = { config: LearningConfig; order: number[]; state: StudyState; answer: string; updatedAt: number };
export const PROGRESS_STORAGE_KEY = "eitango_progress_v1";

export function getLearningConfig(scope: LearningConfig["scope"], params: LearningParams): LearningConfig {
  const exercise = params.exercise === "japanese" || params.exercise === "spelling" ? params.exercise : "english";
  const start = STUDY_RANGES.find(range => String(range.start) === params.start)?.start;
  return { scope, start: scope === "range" ? start ?? 1 : start, exercise,
    mode: exercise === "spelling" ? "manual" : getStudyMode(params.mode), shuffle: params.shuffle === "1" };
}

export function getSessionKey(config: LearningConfig): string {
  return [config.scope, config.start ?? "all", config.mode, config.exercise, config.shuffle ? "shuffle" : "ordered"].join(":");
}

export function getLearningHref(config: LearningConfig): string {
  const params = new URLSearchParams();
  if (config.start !== undefined) params.set("start", String(config.start));
  if (config.mode !== "manual") params.set("mode", config.mode);
  if (config.exercise !== "english") params.set("exercise", config.exercise);
  if (config.shuffle) params.set("shuffle", "1");
  return `/${config.scope === "range" ? "study" : "review"}${params.size ? `?${params}` : ""}`;
}

export function getSessionLabel(config: LearningConfig): string {
  const range = STUDY_RANGES.find(range => range.start === config.start);
  const scope = config.scope === "review" ? `苦手単語${range ? ` ${range.start}〜${range.end}番` : ""}` : `${range?.start}〜${range?.end}番`;
  const exercise = { english: "英語→日本語", japanese: "日本語→英語", spelling: "スペル入力" }[config.exercise];
  return `${scope}・${exercise}${config.mode === "auto2" ? "・自動2秒" : config.mode === "auto" ? "・自動3秒" : ""}${config.shuffle ? "・シャッフル" : ""}`;
}

export function shuffleWords<T>(words: T[], random: () => number = Math.random): T[] {
  const result = [...words];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createLearningSession(words: StudyWord[], config: LearningConfig, saved?: ProgressEntry) {
  if (saved && getSessionKey(saved.config) === getSessionKey(config)) {
    const available = new Map(words.map(word => [word.number, word]));
    const kept = saved.order.flatMap(number => available.has(number) ? [available.get(number)!] : []);
    const known = new Set(saved.order);
    const added = words.filter(word => !known.has(word.number));
    const ordered = config.shuffle ? [...kept, ...shuffleWords(added)] : [...words];
    const current = saved.order[saved.state.index];
    let index = ordered.findIndex(word => word.number === current);
    if (index < 0) {
      const following = saved.order.slice(saved.state.index + 1).find(number => available.has(number));
      index = following === undefined ? 0 : ordered.findIndex(word => word.number === following);
    }
    const sameWord = ordered[index]?.number === current;
    return { words: ordered, state: { index, revealed: config.mode !== "manual" || (sameWord && saved.state.revealed), complete: false },
      answer: sameWord ? saved.answer : "" };
  }
  return { words: config.shuffle ? shuffleWords(words) : [...words], state: getInitialStudyState(config.mode), answer: "" };
}

export function parseProgress(value: string | null): ProgressEntry[] {
  if (!value) return [];
  try {
    const data: unknown = JSON.parse(value);
    if (!Array.isArray(data)) return [];
    return data.filter((entry): entry is ProgressEntry => {
      if (!entry || typeof entry !== "object") return false;
      const { config, order, state, answer, updatedAt } = entry;
      if (!config || !state || !Array.isArray(order) || !order.length || order.length > 1900) return false;
      if (!order.every(number => Number.isInteger(number) && number >= 1 && number <= 1900) || new Set(order).size !== order.length) return false;
      if (config.scope !== "range" && config.scope !== "review") return false;
      if (config.start !== undefined && !STUDY_RANGES.some(range => range.start === config.start)) return false;
      if (config.scope === "range" && config.start === undefined) return false;
      if (!["manual", "auto2", "auto"].includes(config.mode) || !["english", "japanese", "spelling"].includes(config.exercise) || typeof config.shuffle !== "boolean") return false;
      if (config.exercise === "spelling" && config.mode !== "manual") return false;
      if (config.start !== undefined) {
        const range = STUDY_RANGES.find(range => range.start === config.start)!;
        if (!order.every(number => number >= range.start && number <= range.end)) return false;
      }
      return Number.isInteger(state.index) && state.index >= 0 && state.index < order.length && state.complete === false
        && typeof state.revealed === "boolean" && typeof answer === "string" && answer.length <= 200 && Number.isFinite(updatedAt);
    }).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);
  } catch { return []; }
}

export function moveStudy(state: StudyState, direction: "next" | "previous", total: number, mode: StudyMode): StudyState {
  if (direction === "previous") {
    if (state.index === 0 && !state.complete) return state;
    return { index: state.complete ? state.index : state.index - 1, revealed: mode !== "manual", complete: false };
  }
  if (state.complete) return state;
  if (state.index + 1 >= total) return { ...state, complete: true };
  return { index: state.index + 1, revealed: mode !== "manual", complete: false };
}

export function getSwipeDirection(dx: number, dy: number): "next" | "previous" | null {
  return Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5 ? dx < 0 ? "next" : "previous" : null;
}

export function matchesSpelling(answer: string, word: string): boolean {
  const normalize = (value: string) => value.normalize("NFKC").trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[‐‑–]/g, "-").replace(/\s+/g, " ");
  return normalize(answer) !== "" && normalize(answer) === normalize(word);
}
