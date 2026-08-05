import type { InferredExtraction } from "./types";

/** Canned stand-in for analyzeStyle's LLM output, used when MOCK_ANALYSIS is set. */
export const MOCK_INFERRED: InferredExtraction = {
  domain: "ui",
  domainConfidence: 0.82,
  typeScale: {
    display: "Grotesk sans, bold, large — display/headline role",
    body: "Grotesk sans, regular weight — body/reading role",
  },
  spacingScale: [4, 8, 16, 24, 40],
  grid: "12-col, 24px gutter",
  styleVocabulary: ["minimal", "high-contrast", "generous negative space"],
  brief:
    "Mock brief (MOCK_ANALYSIS is on): this stands in for the real vision-model output so you can preview the confirm/result screens without spending API tokens.",
};
