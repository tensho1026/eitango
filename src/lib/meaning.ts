export function splitMeaning(meaning: string): string[] {
  const brackets: Record<string, string> = { "（": "）", "(": ")", "［": "］", "[": "]", "〔": "〕", "【": "】" };
  const closingBrackets: string[] = [];
  const lines: string[] = [];
  let line = "";

  for (const character of meaning) {
    if (brackets[character]) closingBrackets.push(brackets[character]);
    else if (character === closingBrackets.at(-1)) closingBrackets.pop();

    // 括弧内の注釈はまとめ、意味を区切る句読点でだけ改行する。
    if (closingBrackets.length === 0 && /[；;，,、\n]/.test(character)) {
      if (line.trim()) lines.push(line.trim());
      line = "";
    } else {
      line += character;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
