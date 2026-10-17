"use client";

import { useMemo, useRef } from "react";
import { isAdjacent, wallKey, type ZipPublic } from "@/lib/games/zip";

const BOX = 336;

export function ZipBoard({
  puzzle,
  path,
  onChange,
  disabled = false,
  hintCell = null,
}: {
  puzzle: ZipPublic;
  path: number[];
  onChange: (path: number[]) => void;
  disabled?: boolean;
  hintCell?: number | null;
}) {
  const { size, numbers, walls } = puzzle;
  const n = size * size;
  const S = BOX / size;
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pathRef = useRef(path);
  pathRef.current = path;

  const wallSet = useMemo(() => new Set(walls.map(([a, b]) => wallKey(a, b))), [walls]);
  const numberIndex = useMemo(() => new Map(numbers.map((c, i) => [c, i] as const)), [numbers]);
  const lastNumber = numbers[numbers.length - 1];

  const cellAt = (clientX: number, clientY: number, strict: boolean): number | null => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    if (px < 0 || py < 0 || px >= r.width || py >= r.height) return null;
    const fx = (px / r.width) * size;
    const fy = (py / r.height) * size;
    const c = Math.floor(fx);
    const row = Math.floor(fy);
    if (strict) {
      // only count the middle of a cell while dragging, so a diagonal swipe does not jump
      const dx = Math.abs(fx - c - 0.5);
      const dy = Math.abs(fy - row - 0.5);
      if (dx > 0.42 || dy > 0.42) return null;
    }
    return row * size + c;
  };

  const update = (next: number[]) => {
    pathRef.current = next;
    onChange(next);
  };

  const extend = (cell: number) => {
    const p = pathRef.current;
    if (p.length === 0) {
      if (cell === numbers[0]) update([cell]);
      return;
    }
    const head = p[p.length - 1];
    if (cell === head) return;
    if (p.length >= 2 && cell === p[p.length - 2]) {
      update(p.slice(0, -1));
      return;
    }
    if (p.includes(cell)) return;
    if (!isAdjacent(size, head, cell) || wallSet.has(wallKey(head, cell))) return;
    const ni = numberIndex.get(cell);
    if (ni !== undefined) {
      const expected = p.filter((c) => numberIndex.has(c)).length;
      if (ni !== expected) return;
      if (cell === lastNumber && p.length !== n - 1) return;
    }
    update([...p, cell]);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const cell = cellAt(e.clientX, e.clientY, false);
    if (cell === null) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pathRef.current;
    const idx = p.indexOf(cell);
    if (idx >= 0) {
      if (idx < p.length - 1) update(p.slice(0, idx + 1));
    } else {
      extend(cell);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || disabled) return;
    const cell = cellAt(e.clientX, e.clientY, true);
    if (cell !== null) extend(cell);
  };

  const stop = () => {
    dragging.current = false;
  };

  const gridLines = useMemo(() => {
    let d = "";
    for (let i = 1; i < size; i++) d += `M${i * S} 2 V${BOX - 2} M2 ${i * S} H${BOX - 2} `;
    return d;
  }, [size, S]);

  const wallPath = useMemo(() => {
    return walls
      .map(([a, b]) => {
        const ra = Math.floor(a / size);
        const ca = a % size;
        const rb = Math.floor(b / size);
        const cb = b % size;
        if (ra === rb) {
          const x = Math.max(ca, cb) * S;
          return `M${x} ${ra * S + 3} V${(ra + 1) * S - 3}`;
        }
        const y = Math.max(ra, rb) * S;
        return `M${ca * S + 3} ${y} H${(ca + 1) * S - 3}`;
      })
      .join(" ");
  }, [walls, size, S]);

  const points = path.map((c) => `${(c % size) * S + S / 2},${Math.floor(c / size) * S + S / 2}`).join(" ");
  const head = path.length ? path[path.length - 1] : null;

  return (
    <div
      ref={ref}
      className="board relative w-full max-w-[336px] aspect-square mx-auto"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      role="application"
      aria-label="Zip board"
    >
      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 w-full h-full block" aria-hidden="true">
        <rect x="1" y="1" width={BOX - 2} height={BOX - 2} rx="10" fill="#FFFFFF" stroke="#141414" strokeWidth="2" />
        <path d={gridLines} fill="none" stroke="#DCDED9" strokeWidth="1" />
        {path.length === 1 && (
          <circle cx={(path[0] % size) * S + S / 2} cy={Math.floor(path[0] / size) * S + S / 2} r={S * 0.27} fill="#E9A23B" />
        )}
        {path.length > 1 && (
          <polyline points={points} fill="none" stroke="#E9A23B" strokeWidth={S * 0.54} strokeLinecap="round" strokeLinejoin="round" />
        )}
        <path d={wallPath} fill="none" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => {
          const ni = numberIndex.get(i);
          const isHint = hintCell === i;
          const isHead = head === i && path.length > 0 && path.length < n;
          return (
            <div key={i} className="flex items-center justify-center relative">
              {isHint && <div className="hint-ring absolute inset-[14%] rounded-full border-2 border-dashed border-zip" />}
              {isHead && ni === undefined && <div className="w-[22%] h-[22%] rounded-full bg-white/70" />}
              {ni !== undefined && (
                <div className="display w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-[17px] leading-none">{ni + 1}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
