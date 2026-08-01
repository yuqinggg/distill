"use client";

import { useEffect, useRef } from "react";
import { blobPath, easeInOutSine, lerpRadii, randomRadii } from "@/lib/blob";

const POINTS = 8;
const CYCLE_MS = 2200;

export default function MorphBlob({
  size = 56,
  color = "var(--logo)",
}: {
  size?: number;
  color?: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.34;

    let from = randomRadii(POINTS);
    let to = randomRadii(POINTS);
    let start = performance.now();
    let frameId = 0;

    function tick(now: number) {
      const t = Math.min((now - start) / CYCLE_MS, 1);
      const radii = lerpRadii(from, to, easeInOutSine(t));
      pathRef.current?.setAttribute("d", blobPath(radii, cx, cy, baseRadius));

      if (t >= 1) {
        from = to;
        to = randomRadii(POINTS);
        start = now;
      }
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [size]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path ref={pathRef} fill={color} />
    </svg>
  );
}
