import { StudySession } from "@/components/study-session";
import { getStudyWords } from "@/lib/words";
import { getRange } from "@/lib/study";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ start?: string | string[] }>;
}) {
  const params = await searchParams;
  const range = getRange(params.start);
  const words = await getStudyWords(range);
  return <StudySession key={range.start} words={words} range={range} />;
}
