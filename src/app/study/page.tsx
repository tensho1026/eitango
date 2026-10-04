import { StudySession } from "@/components/study-session";
import { getStudyWords } from "@/lib/words";
import { getRange, getStudyMode } from "@/lib/study";

export default async function StudyPage({ searchParams }: {
  searchParams: Promise<{ start?: string | string[]; mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const range = getRange(params.start);
  const mode = getStudyMode(params.mode);
  return <StudySession key={`${range.start}-${mode}`} words={getStudyWords(range)} mode={mode} />;
}
