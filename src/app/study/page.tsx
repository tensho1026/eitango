import { StudySession } from "@/components/study-session";
import { getStudyWords } from "@/lib/words";
import { getRange } from "@/lib/study";

export default async function StudyPage({ searchParams }: {
  searchParams: Promise<{ start?: string | string[] }>;
}) {
  const range = getRange((await searchParams).start);
  return <StudySession key={range.start} words={getStudyWords(range)} />;
}
