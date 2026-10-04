export const TOTAL_WORDS = 1900;
export const WORDS_PER_RANGE = 200;

export const STUDY_RANGES = Array.from({ length: Math.ceil(TOTAL_WORDS / WORDS_PER_RANGE) }, (_, index) => {
  const start = index * WORDS_PER_RANGE + 1;
  const end = Math.min(start + WORDS_PER_RANGE - 1, TOTAL_WORDS);
  return { start, end, count: end - start + 1, section: index + 1 };
});

export type StudyRange = (typeof STUDY_RANGES)[number];
export type StudyWord = { id: string; number: number; word: string; meaning: string };
export type StudyState = { index: number; revealed: boolean; complete: boolean };
export const INITIAL_STUDY_STATE: StudyState = { index: 0, revealed: false, complete: false };

export function getRange(start?: string | string[]): StudyRange {
  return STUDY_RANGES.find((range) => String(range.start) === start) ?? STUDY_RANGES[0];
}

export function advanceStudy(state: StudyState, total: number): StudyState {
  if (state.complete) return { ...INITIAL_STUDY_STATE };
  if (!state.revealed) return { ...state, revealed: true };
  if (state.index + 1 >= total) return { ...state, complete: true };
  return { index: state.index + 1, revealed: false, complete: false };
}
