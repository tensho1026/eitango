import type { Metadata } from "next";
import { DifficultWordsProvider } from "@/components/difficult-words-provider";
import { LearningProgressProvider } from "@/components/learning-progress-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "eitango — ターゲット1900",
  description: "ターゲット1900を200語ずつ。英単語の意味を確認して次へ進む、シンプルな学習アプリ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body><DifficultWordsProvider><LearningProgressProvider>{children}</LearningProgressProvider></DifficultWordsProvider></body></html>;
}
