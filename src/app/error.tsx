"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="message-page">
    <p>単語を読み込めませんでした。</p>
    <button className="study-button" onClick={reset}>もう一度読み込む</button>
    <Link className="home-button" href="/">ホームに戻る</Link>
  </main>;
}
