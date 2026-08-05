import { Vibrant } from "node-vibrant/node";
import { contrastRatio, relativeLuminance } from "./color";
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

/**
 * Deterministic color layer: k-means-clustered swatches measured directly
 * from pixels, not inferred by a model. Values here are exact hex, unlike
 * the vision-model layer which only approximates typography/layout.
 */
export async function extractColors(
  imageBuffer: Buffer
): Promise<DeterministicExtraction> {
  const palette = await Vibrant.from(imageBuffer).getPalette();

  const swatches = Object.entries(palette).filter(
    (entry): entry is [string, NonNullable<(typeof palette)[keyof typeof palette]>] =>
      Boolean(entry[1])
  );
  const totalPopulation = swatches.reduce(
    (sum, [, swatch]) => sum + swatch.population,
    0
  );

  const colorRoles: ColorRole[] = swatches.map(([name, swatch]) => ({
    hex: swatch.hex,
    role: ROLE_BY_SWATCH[name] ?? name.toLowerCase(),
    percentage: totalPopulation > 0 ? swatch.population / totalPopulation : 0,
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
