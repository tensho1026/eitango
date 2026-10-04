import { resolve } from "node:path";
import { fetchWords, saveLocalWords } from "./target1900";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) throw new Error("使い方: npm run import:words -- [--dry-run]");
  const dryRun = args.includes("--dry-run");
  const words = await fetchWords();
  console.log(`取得・検証完了: ${words.length}件、番号1〜1900、欠落・重複・空欄なし。`);
  if (dryRun) {
    console.log("dry-run: ファイルは更新しません。");
    return;
  }
  const total = await saveLocalWords(words, resolve("src/data/target1900.json"));
  console.log(`ローカルファイルへの保存完了: ${total}件。`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "単語の取り込みに失敗しました。");
  process.exitCode = 1;
});
