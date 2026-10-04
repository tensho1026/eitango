import { DifficultReview } from "@/components/difficult-review";
import { getLearningConfig, getSessionKey, type LearningParams } from "@/lib/learning";
import { getAllStudyWords } from "@/lib/words";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<LearningParams> }) {
  const config = getLearningConfig("review", await searchParams);
  return <DifficultReview key={getSessionKey(config)} words={getAllStudyWords()} config={config} />;
}
