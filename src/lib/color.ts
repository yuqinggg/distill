// Shared pure color-math helpers, safe to import from both server code
// (color-extraction.ts, which also touches node-vibrant) and client components.

function hexToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * hexToLinear(r) + 0.7152 * hexToLinear(g) + 0.0722 * hexToLinear(b)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Picks whichever of near-black/near-white reads better against `hex`. */
export function readableTextColor(hex: string): string {
  const darkText = "#1c1815";
  const lightText = "#fff8f3";
  return contrastRatio(hex, darkText) >= contrastRatio(hex, lightText)
    ? darkText
    : lightText;
}
