import { loadEnvConfig } from "@next/env";

export function getImportConnectionString(): string {
  loadEnvConfig(process.cwd(), true);
  const value = process.env.DATABASE_URL_UNPOOLED;
  if (!value) throw new Error(".env.localにDATABASE_URL_UNPOOLEDを設定してください。");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Postgresの接続URLを指定してください。");
  }
  if (url.hostname.includes("-pooler")) {
    throw new Error("DATABASE_URL_UNPOOLEDには-poolerを含まない直接接続URLを指定してください。");
  }
  return value;
}

export function reportError(error: unknown): void {
  // DB接続URLやパスワードをログに含めない。
  const message = error instanceof Error ? error.message : "不明なエラー";
  console.error(message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[接続URLを省略]"));
  process.exitCode = 1;
}
