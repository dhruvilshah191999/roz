"use client";

import { useEffect, useRef, useState } from "react";
import { roundLength, type FlashPublic } from "@/lib/games/flash";

export type FlashPhase = "ready" | "showing" | "input" | "wrong" | "right";

const ON_MS = 420;
const GAP_MS = 160;

export function FlashBoard({
  puzzle,
  round,
  taps,
  phase,
  onPhase,
  onTap,
  disabled = false,
  hintCell = null,
}: {
  puzzle: FlashPublic;
  round: number;
  taps: number[];
  phase: FlashPhase;
  onPhase: (p: FlashPhase) => void;
  onTap: (cell: number) => void;
  disabled?: boolean;
  hintCell?: number | null;
}) {
  const { size } = puzzle;
  const n = size * size;
  const [lit, setLit] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  // play the round's sequence when asked to
  useEffect(() => {
    if (phase !== "showing") return;
    const len = roundLength(puzzle, round);
    const seq = puzzle.sequence.slice(0, len);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    let t = 350;
    seq.forEach((cell) => {
      timers.current.push(window.setTimeout(() => setLit(cell), t));
      timers.current.push(window.setTimeout(() => setLit(null), t + ON_MS));
      t += ON_MS + GAP_MS;
    });
    timers.current.push(window.setTimeout(() => onPhase("input"), t + 100));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setLit(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const lastTap = taps.length ? taps[taps.length - 1] : null;
  const canTap = phase === "input" && !disabled;

  return (
    <div
      className="board grid gap-2.5 w-full max-w-[300px] mx-auto"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="application"
      aria-label="Flash board"
    >
      {Array.from({ length: n }, (_, i) => {
        const isLit = lit === i;
        const justTapped = phase === "input" && lastTap === i;
        const wrongHere = phase === "wrong" && lastTap === i;
        const bg = isLit ? "#F2B300" : wrongHere ? "#E4572E" : justTapped ? "#1D7A4A" : phase === "right" ? "#E6F4EC" : "#F1F2EE";
        return (
          <button
            key={i}
            type="button"
            disabled={!canTap}
            onClick={() => onTap(i)}
            aria-label={`Tile ${i + 1}`}
            className={`aspect-square rounded-2xl border-0 p-0 transition-colors duration-100 ${hintCell === i ? "hint-ring" : ""}`}
            style={{ background: bg, cursor: canTap ? "pointer" : "default" }}
          >
            <span
              className="block w-[30%] h-[30%] mx-auto rounded-lg transition-colors duration-100"
              style={{ background: isLit ? "#FFE98A" : wrongHere ? "#FFD8CC" : justTapped ? "#8BD3A8" : "#E2E4E0" }}
            />
          </button>
        );
      })}
    </div>
  );
}
