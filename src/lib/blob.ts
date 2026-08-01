export function randomRadii(count: number, min = 0.82, max = 1.18): number[] {
  return Array.from({ length: count }, () => min + Math.random() * (max - min));
}

export function lerpRadii(from: number[], to: number[], t: number): number[] {
  return from.map((r, i) => r + (to[i] - r) * t);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Builds a smooth closed blob path through `count` points spaced evenly
 * around (cx, cy), each offset from `baseRadius` by its entry in `radii`.
 * Uses Catmull-Rom-to-Bezier so the outline stays organic, not polygonal.
 */
export function blobPath(
  radii: number[],
  cx: number,
  cy: number,
  baseRadius: number
): string {
  const n = radii.length;
  const points = radii.map((r, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const radius = baseRadius * r;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });

  const at = (i: number) => points[(i + n) % n];

  let d = `M ${points[0][0]},${points[0][1]} `;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]} `;
  }
  return d + "Z";
}
