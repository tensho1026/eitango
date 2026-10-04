import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eitango — ターゲット1900",
  description: "ターゲット1900を200語ずつ。英単語の意味を確認して次へ進む、シンプルな学習アプリ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
