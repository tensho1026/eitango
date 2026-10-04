import { load } from "cheerio";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export const SOURCE_URL = "https://ukaru-eigo.com/target-1900-word-list/";
export const BOOK_SLUG = "target-1900-6th";
export const EXPECTED_COUNT = 1900;
export type VocabularyWord = { number: number; word: string; meaning: string; isNew: boolean };

export function validateWords(words: VocabularyWord[]): void {
  if (words.length !== EXPECTED_COUNT) {
    throw new Error(`1900件必要ですが、${words.length}件でした。取り込みを中止します。`);
  }
  const numbers = new Set<number>();
  for (const entry of words) {
    if (!Number.isInteger(entry.number) || entry.number < 1 || entry.number > EXPECTED_COUNT || numbers.has(entry.number)) {
      throw new Error(`番号の範囲・重複が不正です: ${entry.number}`);
    }
    if (!entry.word.trim() || !entry.meaning.trim() || typeof entry.isNew !== "boolean") {
      throw new Error(`単語・意味・新規フラグが不正です: ${entry.number}`);
    }
    numbers.add(entry.number);
  }
}

export function parseWords(html: string): VocabularyWord[] {
  const $ = load(html);
  const tables = $("table").toArray().filter((table) => {
    const headings = $(table).find("tr").first().find("th, td").toArray().map((cell) => $(cell).text().trim());
    return headings.length === 4 && headings[1] === "番号" && headings[2] === "単語" && headings[3] === "意味";
  });
  if (tables.length !== 1) throw new Error("単語表を特定できません。ページの構造を確認してください。");

  const words: VocabularyWord[] = [];
  for (const row of $(tables[0]).find("tr").toArray().slice(1)) {
    const cells = $(row).children("td");
    if (cells.length !== 4) throw new Error("単語表の列数が変わっています。");
    const text = (index: number) => cells.eq(index).text().replace(/\s+/g, " ").trim();
    const marker = text(0);
    const numberText = text(1);
    if (!["", "新"].includes(marker) || !/^\d+$/.test(numberText)) throw new Error("新規フラグ・番号の形式が不正です。");
    words.push({ number: Number(numberText), word: text(2), meaning: text(3), isNew: marker === "新" });
  }
  validateWords(words);
  return words.sort((a, b) => a.number - b.number);
}

export async function fetchWords(): Promise<VocabularyWord[]> {
  const response = await fetch(SOURCE_URL, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "Target1900Importer/1.0", Accept: "text/html" },
  });
  if (!response.ok) throw new Error(`単語ページの取得に失敗しました: HTTP ${response.status}`);
  return parseWords(await response.text());
}

export async function saveLocalWords(words: VocabularyWord[], destination: string) {
  validateWords(words);
  let previous: { words: (VocabularyWord & { id: string })[] } | undefined;
  try {
    const existing = JSON.parse(await readFile(destination, "utf8")) as NonNullable<typeof previous>;
    validateWords(existing.words);
    previous = existing;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const ids = new Map(previous?.words.map((word) => [word.number, word.id]));
  const payload = {
    title: "英単語ターゲット1900", edition: "6訂版", sourceUrl: SOURCE_URL,
    words: [...words].sort((a, b) => a.number - b.number).map((word) => ({ id: ids.get(word.number) ?? `${BOOK_SLUG}-${word.number}`, ...word })),
  };
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(payload, null, 2) + "\n");
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return payload.words.length;
}
