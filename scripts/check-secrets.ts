import { execFileSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);
const secrets = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter((value): value is string => Boolean(value));
for (const value of [...secrets]) {
  const password = decodeURIComponent(new URL(value).password);
  if (password) secrets.push(password);
}
const paths = execFileSync("git", ["ls-files", "--cached", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
if (paths.length === 0) throw new Error("先に公開するファイルをGitへ登録してください。");
const violations: string[] = [];
for (const path of paths) {
  const contents = execFileSync("git", ["show", `:${path}`], { maxBuffer: 20 * 1024 * 1024 });
  if (path.split("/").some((part) => part.startsWith(".env")) ||
    secrets.some((secret) => contents.includes(Buffer.from(secret))) ||
    /npg_[a-zA-Z0-9]{8,}/.test(contents.toString("utf8"))) violations.push(path);
}
if (violations.length) {
  console.error("接続情報または環境変数ファイルがGitに含まれています。対象ファイル:", violations.join(", "));
  process.exitCode = 1;
} else {
  console.log(`確認完了: ${paths.length}ファイル。環境変数ファイル・設定済み接続URL・パスワードなし。`);
}
