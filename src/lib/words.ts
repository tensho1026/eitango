import dataset from "../data/target1900.json";
import type { StudyRange, StudyWord } from "./study";

export function getStudyWords(range: StudyRange): StudyWord[] {
  const words = dataset.words.slice(range.start - 1, range.end);
  if (words.length !== range.count || words.some((word, index) => word.number !== range.start + index)) {
    throw new Error("選択した範囲の単語データが揃っていません。");
  }
  return words.map(({ id, number, word, meaning }) => ({ id, number, word, meaning }));
}
