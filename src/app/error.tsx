"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="message-page">
    <p className="eyebrow" style={{ justifyContent: "center" }}>PLEASE TRY AGAIN</p>
    <h1>単語を読み込めませんでした。</h1>
    <p>少し時間をおいて、もう一度お試しください。</p>
    <button className="study-button" onClick={reset}>もう一度読み込む</button>
  </main>;
}
