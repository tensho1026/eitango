import { StudyWorkspace } from "@/components/study-workspace";
import { getStudyWords } from "@/lib/words";
import { getRange } from "@/lib/study";
import { getLearningConfig, getSessionKey, type LearningParams } from "@/lib/learning";

export default async function StudyPage({ searchParams }: {
  searchParams: Promise<LearningParams>;
}) {
  const params = await searchParams;
  const range = getRange(params.start);
  const config = getLearningConfig("range", params);
  return <StudyWorkspace key={getSessionKey(config)} words={getStudyWords(range)} config={config} />;
}
