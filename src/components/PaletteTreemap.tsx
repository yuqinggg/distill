import { readableTextColor } from "@/lib/color";
import type { ColorRole } from "@/lib/types";

interface Tile {
  color: ColorRole;
  x: number; // percent
  y: number; // percent
  w: number; // percent
  h: number; // percent
}

interface WeightedColor {
  color: ColorRole;
  weight: number;
}

// Floor applied to layout area (not the displayed percentage) so a
// near-zero swatch still gets a legible tile instead of a sliver.
const MIN_AREA_SHARE = 0.05;

/** Alternating-orientation slice-and-dice treemap: simple, dependency-free, and stable for small N. */
function layout(
  items: WeightedColor[],
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean
): Tile[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ color: items[0].color, x, y, w, h }];

  const total = items.reduce((sum, i) => sum + i.weight, 0) || 1;
  let acc = 0;
  let splitIndex = 1;
  for (let i = 0; i < items.length; i++) {
    acc += items[i].weight;
    if (acc >= total / 2) {
      splitIndex = i + 1;
      break;
    }
  }
  splitIndex = Math.min(Math.max(splitIndex, 1), items.length - 1);

  const left = items.slice(0, splitIndex);
  const right = items.slice(splitIndex);
  const leftShare = left.reduce((sum, i) => sum + i.weight, 0) / total;

  if (horizontal) {
    const leftW = w * leftShare;
    return [
      ...layout(left, x, y, leftW, h, !horizontal),
      ...layout(right, x + leftW, y, w - leftW, h, !horizontal),
    ];
  }
  const leftH = h * leftShare;
  return [
    ...layout(left, x, y, w, leftH, !horizontal),
    ...layout(right, x, y + leftH, w, h - leftH, !horizontal),
  ];
}

export default function PaletteTreemap({ palette }: { palette: ColorRole[] }) {
  const sorted = [...palette].sort((a, b) => b.percentage - a.percentage);
  const weighted: WeightedColor[] = sorted.map((color) => ({
    color,
    weight: Math.max(color.percentage, MIN_AREA_SHARE),
  }));
  const tiles = layout(weighted, 0, 0, 100, 100, true);

  return (
    <div className="relative h-72 w-full sm:h-80">
      {tiles.map((tile) => {
        const textColor = readableTextColor(tile.color.hex);
        const small = tile.w < 16 || tile.h < 22;
        return (
          <div
            key={tile.color.role}
            className="absolute box-border overflow-hidden p-3"
            style={{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: `${tile.w}%`,
              height: `${tile.h}%`,
              backgroundColor: tile.color.hex,
              color: textColor,
            }}
          >
            <div className="flex h-full flex-col justify-end gap-0.5">
              <span
                className={`truncate font-medium ${small ? "text-[11px]" : "text-sm"}`}
              >
                {tile.color.role}
              </span>
              {!small && (
                <span className="truncate text-xs opacity-70">
                  {tile.color.hex}
                </span>
              )}
              <span className="text-[10px] opacity-60">
                {Math.round(tile.color.percentage * 100)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
