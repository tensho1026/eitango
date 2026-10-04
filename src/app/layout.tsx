import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "eitango — ひとつずつ、身につける。",
  description: "ターゲット1900を200語ずつ。ひとつのボタンで、英単語の意味を確認して次へ進むシンプルな学習アプリ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body><div className="app-shell">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="eitango ホーム"><span className="brand-icon" aria-hidden="true">e.</span><span>eitango<span className="brand-dot">.</span></span></Link>
      <span className="book-badge"><span className="badge-dot" /> TARGET 1900 <span className="badge-edition">6訂版</span></span>
    </header>
    {children}
    <footer className="site-footer"><span>ひとつずつ、身につける。</span><span>SMALL STEPS, MORE WORDS.</span></footer>
  </div></body></html>;
}
