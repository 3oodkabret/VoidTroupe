export type MbtiDepth = "quick" | "medium" | "accurate";

export type MbtiDimension = "EI" | "SN" | "TF" | "JP";

export type MbtiOptionValue = 2 | 1 | 0 | -1 | -2;

export type MbtiOptionKey =
  | "stronglyAgree"
  | "agree"
  | "neutral"
  | "disagree"
  | "stronglyDisagree";

export type MbtiQuestion = {
  id: string;
  dimension: MbtiDimension;
  reverse: boolean;
};

export type MbtiResult = {
  code: string;
  depth: MbtiDepth;
  totalQuestions: number;
  scores: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
};

const DEPTH_QUESTION_COUNT: Record<MbtiDepth, number> = {
  quick: 15,
  medium: 25,
  accurate: 40,
};

const DIMENSION_SEQUENCE: MbtiDimension[] = ["EI", "SN", "TF", "JP"];

export const MBTI_OPTIONS: Array<{ key: MbtiOptionKey; value: MbtiOptionValue }> = [
  { key: "stronglyAgree", value: 2 },
  { key: "agree", value: 1 },
  { key: "neutral", value: 0 },
  { key: "disagree", value: -1 },
  { key: "stronglyDisagree", value: -2 },
];

export const MBTI_QUESTION_BANK: MbtiQuestion[] = Array.from({ length: 40 }, (_, i) => ({
  id: `q${i + 1}`,
  dimension: DIMENSION_SEQUENCE[i % DIMENSION_SEQUENCE.length] as MbtiDimension,
  reverse: i % 2 === 1,
}));

function pairFromDimension(dimension: MbtiDimension): [string, string] {
  switch (dimension) {
    case "EI":
      return ["E", "I"];
    case "SN":
      return ["S", "N"];
    case "TF":
      return ["T", "F"];
    case "JP":
      return ["J", "P"];
  }
}

export function getQuestionCountForDepth(depth: MbtiDepth): number {
  return DEPTH_QUESTION_COUNT[depth];
}

export function getQuestionsForDepth(depth: MbtiDepth): MbtiQuestion[] {
  return MBTI_QUESTION_BANK.slice(0, getQuestionCountForDepth(depth));
}

export function scoreMbti(
  depth: MbtiDepth,
  answers: Record<string, MbtiOptionValue>,
): MbtiResult {
  const questions = getQuestionsForDepth(depth);
  const totals: MbtiResult["scores"] = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  for (const question of questions) {
    const rawValue = answers[question.id] ?? 0;
    const weighted = question.reverse ? -rawValue : rawValue;
    totals[question.dimension] += weighted;
  }

  const code = (["EI", "SN", "TF", "JP"] as MbtiDimension[])
    .map((dimension) => {
      const [first, second] = pairFromDimension(dimension);
      return totals[dimension] >= 0 ? first : second;
    })
    .join("");

  return {
    code,
    depth,
    totalQuestions: questions.length,
    scores: totals,
  };
}
