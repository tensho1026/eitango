import { DifficultList } from "@/components/difficult-list";
import { getLearningConfig, getSessionKey, type LearningParams } from "@/lib/learning";
import { getAllStudyWords } from "@/lib/words";

export default async function DifficultPage({ searchParams }: { searchParams: Promise<LearningParams> }) {
  const config = getLearningConfig("review", await searchParams);
  return <DifficultList key={getSessionKey(config)} words={getAllStudyWords()} config={config} />;
}
