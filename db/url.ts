export function getDatabaseUrl(direct = false): string {
  const value = direct ? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL : process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URLが設定されていません。");
  const url = new URL(value);
  if (direct) url.hostname = url.hostname.replace("-pooler.", ".");
  if (url.searchParams.get("sslmode") === "require") url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
