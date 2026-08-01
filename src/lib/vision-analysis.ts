import Anthropic from "@anthropic-ai/sdk";
import type { DeterministicExtraction, InferredExtraction } from "./types";

const MODEL = "claude-sonnet-5";

const SUBMIT_TOOL_NAME = "submit_extraction";

const submitExtractionTool: Anthropic.Tool = {
  name: SUBMIT_TOOL_NAME,
  description:
    "Submit the inferred design-vocabulary extraction for this image.",
  input_schema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        enum: ["editorial", "ui"],
        description:
          "Whether this image is an editorial/print design (magazine spread, poster, brand collateral) or a digital UI (app/website screenshot).",
      },
      domainConfidence: {
        type: "number",
        description: "Confidence in the domain classification, 0 to 1.",
      },
      typeScale: {
        type: "object",
        properties: {
          display: {
            type: "string",
            description:
              "Approximate description of the display/headline type: family style (serif/sans/slab/display), relative size, weight.",
          },
          body: {
            type: "string",
            description:
              "Approximate description of the body/reading type: family style, relative size, weight.",
          },
        },
        required: ["display", "body"],
      },
      spacingScale: {
        type: "array",
        items: { type: "number" },
        description:
          "Approximate spacing ladder in px implied by the composition's rhythm, e.g. [4, 8, 16, 24, 40].",
      },
      grid: {
        type: "string",
        description:
          "Approximate grid/layout structure, e.g. '12-col, 24px gutter' or '6-col asymmetric, wide margins'.",
      },
      styleVocabulary: {
        type: "array",
        items: { type: "string" },
        description:
          "3-6 descriptive adjectives/terms that name this design's style, the kind a trained designer would use.",
      },
      brief: {
        type: "string",
        description:
          "A 2-3 sentence paragraph, written as an implementation brief, ready to paste directly as a prompt for a developer or AI coding agent to recreate this look.",
      },
    },
    required: [
      "domain",
      "domainConfidence",
      "typeScale",
      "spacingScale",
      "grid",
      "styleVocabulary",
      "brief",
    ],
  },
};

function buildPrompt(deterministic: DeterministicExtraction): string {
  const paletteLine = deterministic.palette
    .map((c) => `${c.role}: ${c.hex}`)
    .join(", ");

  return `You are analyzing an uploaded image for a design-vocabulary extraction tool. The measured color palette (already extracted by pixel analysis, do not re-derive colors) is: ${paletteLine}. Contrast notes: ${deterministic.contrastNotes}

Classify this image as "editorial" (print/magazine/poster/brand collateral) or "ui" (app/website screenshot), then infer its typography, spacing rhythm, grid, and style vocabulary from what you see. Be precise but mark approximations as approximations in your language (e.g. "roughly", "reads as") rather than stating exact pixel values you cannot verify from a raster image. Call ${SUBMIT_TOOL_NAME} with your findings.`;
}

/**
 * Inferred layer: vision-model reasoning over typography, layout rhythm, and
 * style vocabulary. Deliberately separate from color-extraction.ts, which
 * measures pixels directly — the model is bad at reporting exact hex/px
 * values, so it never has to; it only reasons about what it's good at.
 */
export async function analyzeStyle(
  imageBuffer: Buffer,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  deterministic: DeterministicExtraction
): Promise<InferredExtraction> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [submitExtractionTool],
    tool_choice: { type: "tool", name: SUBMIT_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBuffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: buildPrompt(deterministic),
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Model did not return a structured extraction.");
  }

  return toolUse.input as InferredExtraction;
}
