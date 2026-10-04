import { DifficultReview } from "@/components/difficult-review";
import { getStudyMode } from "@/lib/study";
import { getAllStudyWords } from "@/lib/words";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const mode = getStudyMode((await searchParams).mode);
  return <DifficultReview key={mode} words={getAllStudyWords()} mode={mode} />;
}
