export type Domain = "editorial" | "ui";

export interface ColorRole {
  hex: string;
  role: string; // e.g. "primary", "accent", "neutral-light", "neutral-dark"
}

/** Measured directly from image pixels (deterministic, no model inference). */
export interface DeterministicExtraction {
  palette: ColorRole[];
  contrastNotes: string; // e.g. "Primary vs. background contrast ratio ~7:1 (AA/AAA safe)"
}

/** Inferred by the vision model — approximate by nature, never claimed as exact. */
export interface InferredExtraction {
  domain: Domain;
  domainConfidence: number; // 0-1
  typeScale: {
    display: string; // e.g. "Serif, large, bold — display/headline role"
    body: string; // e.g. "Grotesk sans, regular weight — body/reading role"
  };
  spacingScale: number[]; // approximate px ladder, e.g. [4, 8, 16, 24, 40]
  grid: string; // e.g. "12-col, 24px gutter" or "6-col asymmetric, wide margins"
  styleVocabulary: string[]; // e.g. ["brutalist", "high-contrast", "generous negative space"]
  brief: string; // 2-3 sentence paragraph, ready to paste as an implementation prompt
}

export interface ExtractionResult {
  deterministic: DeterministicExtraction;
  inferred: InferredExtraction;
}
