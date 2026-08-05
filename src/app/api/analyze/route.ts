import { NextResponse } from "next/server";
import { extractColors } from "@/lib/color-extraction";
import { analyzeStyle } from "@/lib/vision-analysis";
import { toMarkdown } from "@/lib/markdown-export";
import { MOCK_INFERRED } from "@/lib/mock-inferred";
import type { ExtractionResult } from "@/lib/types";

// Skips the paid vision-model call (analyzeStyle) and returns canned data for
// it instead, so the upload -> confirm -> result UI can be exercised for
// free. Color extraction still runs for real since it's local/deterministic.
const MOCK_ANALYSIS = process.env.MOCK_ANALYSIS === "true";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file provided under the 'image' field." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  try {
    const deterministic = await extractColors(buffer);
    const inferred = MOCK_ANALYSIS
      ? MOCK_INFERRED
      : await analyzeStyle(buffer, mediaType, deterministic);

    const result: ExtractionResult = { deterministic, inferred };
    const markdown = toMarkdown(result);

    return NextResponse.json({ result, markdown });
  } catch (error) {
    console.error("Extraction failed:", error);
    return NextResponse.json(
      { error: "Extraction failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
