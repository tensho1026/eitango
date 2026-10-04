import Link from "next/link";
import { STUDY_RANGES } from "@/lib/study";

export default function Home() {
  return (
    <main className="home-screen">
      <h1>ターゲット1900</h1>
      <h2>学習する範囲</h2>
      <nav className="range-grid" aria-label="学習する範囲">
        {STUDY_RANGES.map((range) => (
          <Link className="range-option" href={`/study?start=${range.start}`} key={range.start}>
            {range.start}〜{range.end}番
          </Link>
        ))}
      </nav>
    </main>
  );
}
