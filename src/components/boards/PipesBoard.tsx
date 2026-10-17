"use client";

import { useMemo } from "react";
import { E, N, S, W, flow, rotateMask, type PipesPublic } from "@/lib/games/pipes";

const WET = "#2563EB";
const DRY = "#A3A9B3";

const END: Record<number, [number, number]> = {
  [N]: [30, 0],
  [E]: [60, 30],
  [S]: [30, 60],
  [W]: [0, 30],
};

export function PipesBoard({
  puzzle,
  turns,
  onTurn,
  disabled = false,
  locked = [],
  hintCell = null,
}: {
  puzzle: PipesPublic;
  /** cumulative clockwise quarter turns per cell (unbounded, for smooth animation) */
  turns: number[];
  onTurn: (cell: number) => void;
  disabled?: boolean;
  locked?: number[];
  hintCell?: number | null;
}) {
  const { size, source, kinds, masks } = puzzle;
  const n = size * size;
  const current = useMemo(() => masks.map((m, i) => rotateMask(m, (turns[i] ?? 0) % 4)), [masks, turns]);
  const wet = useMemo(() => flow(size, current, source), [size, current, source]);
  const lockedSet = useMemo(() => new Set(locked), [locked]);

  return (
    <div
      className="board grid gap-1.5 w-full max-w-[340px] mx-auto"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="application"
      aria-label="Pipes board"
    >
      {Array.from({ length: n }, (_, i) => {
        const kind = kinds[i];
        const isWet = wet.has(i);
        const color = isWet ? WET : DRY;
        const base = masks[i];
        const bg = kind === "house" ? (isWet ? "#E6F4EC" : "#F1F2EE") : isWet ? "#E3EEF9" : "#F1F2EE";
        const isLocked = lockedSet.has(i);
        const isHint = hintCell === i;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || isLocked}
            onClick={() => onTurn(i)}
            aria-label={kind === "source" ? "Water tank" : kind === "house" ? (isWet ? "House with water" : "House without water") : "Pipe, tap to turn"}
            className={`relative aspect-square rounded-[10px] border-0 p-0 flex items-center justify-center ${isHint ? "hint-ring" : ""}`}
            style={{ background: bg, cursor: disabled || isLocked ? "default" : "pointer" }}
          >
            <svg viewBox="0 0 60 60" className="w-full h-full block" aria-hidden="true">
              <g
                style={{
                  transformOrigin: "30px 30px",
                  transform: `rotate(${(turns[i] ?? 0) * 90}deg)`,
                  transition: "transform 160ms ease-out",
                }}
              >
                {[N, E, S, W].map((d) =>
                  base & d ? (
                    <line key={d} x1="30" y1="30" x2={END[d][0]} y2={END[d][1]} stroke={color} strokeWidth="11" strokeLinecap="butt" />
                  ) : null,
                )}
                {kind === "pipe" && <circle cx="30" cy="30" r="6" fill={color} />}
              </g>
              {kind === "source" && <rect x="12" y="12" width="36" height="36" rx="7" fill={WET} />}
              {kind === "source" && <path d="M30 20c-5 6-6 9-6 12a6 6 0 0 0 12 0c0-3-1-6-6-12z" fill="#FFFFFF" />}
              {kind === "house" && <path d="M12 30 L30 13 L48 30 V49 H12 Z" fill={isWet ? "#1D7A4A" : "#C9CDD3"} />}
              {kind === "house" && <rect x="25" y="36" width="10" height="13" rx="1.5" fill="#FFFFFF" />}
            </svg>
            {isLocked && <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-green" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
