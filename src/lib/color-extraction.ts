import { Vibrant } from "node-vibrant/node";
import type { ColorRole, DeterministicExtraction } from "./types";

// Vibrant swatch name -> semantic role used in the exported token set.
const ROLE_BY_SWATCH: Record<string, string> = {
  Vibrant: "primary",
  DarkVibrant: "primary-dark",
  LightVibrant: "accent-light",
  Muted: "neutral",
  DarkMuted: "neutral-dark",
  LightMuted: "neutral-light",
};

function hexToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b)
  );
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Deterministic color layer: k-means-clustered swatches measured directly
 * from pixels, not inferred by a model. Values here are exact hex, unlike
 * the vision-model layer which only approximates typography/layout.
 */
export async function extractColors(
  imageBuffer: Buffer
): Promise<DeterministicExtraction> {
  const palette = await Vibrant.from(imageBuffer).getPalette();

  const colorRoles: ColorRole[] = Object.entries(palette)
    .filter(([, swatch]) => swatch)
    .map(([name, swatch]) => ({
      hex: swatch!.hex,
      role: ROLE_BY_SWATCH[name] ?? name.toLowerCase(),
    }));

  const lightest = colorRoles.reduce((a, b) =>
    relativeLuminance(a.hex) > relativeLuminance(b.hex) ? a : b
  );
  const darkest = colorRoles.reduce((a, b) =>
    relativeLuminance(a.hex) < relativeLuminance(b.hex) ? a : b
  );

  let contrastNotes = "Not enough distinct swatches to assess contrast.";
  if (lightest && darkest && lightest.hex !== darkest.hex) {
    const ratio = contrastRatio(lightest.hex, darkest.hex);
    const aaNormal = ratio >= 4.5 ? "passes" : "fails";
    const aaLarge = ratio >= 3 ? "passes" : "fails";
    contrastNotes = `${darkest.role} (${darkest.hex}) on ${lightest.role} (${lightest.hex}) is ${ratio.toFixed(
      2
    )}:1 — ${aaNormal} WCAG AA normal text, ${aaLarge} AA large text.`;
  }

  return { palette: colorRoles, contrastNotes };
}
