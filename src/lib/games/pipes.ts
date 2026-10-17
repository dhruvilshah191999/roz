/**
 * Pipes: rotate tiles so water from the tank reaches every house.
 *
 * Each tile has a 4-bit mask of open ends: N=1, E=2, S=4, W=8.
 * The client sends, per cell, how many clockwise quarter turns it applied to
 * the mask it was given. The server rotates and flood-fills.
 */
import { Rng } from "./rng";

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export type PipeKind = "pipe" | "source" | "house";

export interface PipesPuzzle {
  size: number;
  source: number;
  kinds: PipeKind[];
  /** Masks in the solved state. Never sent to the client. */
  solution: number[];
  /** Masks as first shown to the player. */
  initial: number[];
}

export interface PipesPublic {
  size: number;
  source: number;
  kinds: PipeKind[];
  masks: number[];
}

export type PipesHint = { cell: number; rotation: number } | { done: true };

export function rotateMask(mask: number, quarterTurns: number): number {
  let m = mask & 15;
  const t = ((quarterTurns % 4) + 4) % 4;
  for (let i = 0; i < t; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}

const OPPOSITE: Record<number, number> = { [N]: S, [S]: N, [E]: W, [W]: E };

function step(size: number, cell: number, dir: number): number {
  const r = Math.floor(cell / size);
  const c = cell % size;
  if (dir === N) return r > 0 ? cell - size : -1;
  if (dir === S) return r < size - 1 ? cell + size : -1;
  if (dir === E) return c < size - 1 ? cell + 1 : -1;
  if (dir === W) return c > 0 ? cell - 1 : -1;
  return -1;
}

/** Cells reached by water from the source, following mutually open ends. */
export function flow(size: number, masks: number[], source: number): Set<number> {
  const wet = new Set<number>([source]);
  const queue = [source];
  while (queue.length) {
    const cell = queue.shift()!;
    for (const dir of [N, E, S, W]) {
      if (!(masks[cell] & dir)) continue;
      const nb = step(size, cell, dir);
      if (nb < 0 || wet.has(nb)) continue;
      if (!(masks[nb] & OPPOSITE[dir])) continue;
      wet.add(nb);
      queue.push(nb);
    }
  }
  return wet;
}

export function generatePipes(rng: Rng, size = 5): PipesPuzzle {
  const n = size * size;

  for (let attempt = 0; attempt < 50; attempt++) {
    // randomised depth-first spanning tree: long runs, few dead ends (= houses)
    const masks = new Array<number>(n).fill(0);
    const inTree = new Uint8Array(n);
    const stack: number[] = [rng.int(n)];
    inTree[stack[0]] = 1;
    while (stack.length) {
      const cell = stack[stack.length - 1];
      const options = rng.shuffle([N, E, S, W].filter((d) => {
        const nb = step(size, cell, d);
        return nb >= 0 && !inTree[nb];
      }));
      if (options.length === 0) {
        stack.pop();
        continue;
      }
      const dir = options[0];
      const nb = step(size, cell, dir);
      inTree[nb] = 1;
      masks[cell] |= dir;
      masks[nb] |= OPPOSITE[dir];
      stack.push(nb);
    }

    const degree = (cell: number) => [N, E, S, W].filter((d) => masks[cell] & d).length;
    const source = rng.int(n);
    const kinds: PipeKind[] = masks.map((_, cell) => {
      if (cell === source) return "source";
      return degree(cell) === 1 ? "house" : "pipe";
    });
    const houses = kinds.filter((k) => k === "house").length;
    if (houses < 3 || houses > 6) continue;

    // scramble: random rotation per tile, then make sure it is not already solved
    let initial = masks.map((m) => rotateMask(m, rng.int(4)));
    const solved = () => {
      const wet = flow(size, initial, source);
      return kinds.every((k, i) => k !== "house" || wet.has(i));
    };
    let guard = 0;
    while (solved() && guard++ < 20) {
      const cell = rng.int(n);
      initial = initial.slice();
      initial[cell] = rotateMask(initial[cell], 1 + rng.int(3));
    }
    if (solved()) continue;

    return { size, source, kinds, solution: masks, initial };
  }
  throw new Error("pipes: could not generate a puzzle");
}

export function toPipesPublic(p: PipesPuzzle): PipesPublic {
  return { size: p.size, source: p.source, kinds: p.kinds, masks: p.initial };
}

function readRotations(p: PipesPuzzle, state: unknown): number[] | null {
  const raw = (state as { rotations?: unknown } | null)?.rotations;
  const n = p.size * p.size;
  if (!Array.isArray(raw) || raw.length !== n) return null;
  if (!raw.every((r) => Number.isInteger(r) && r >= 0 && r <= 3)) return null;
  return raw as number[];
}

export function currentMasks(p: PipesPuzzle | PipesPublic, rotations: number[]): number[] {
  const base = "initial" in p ? p.initial : p.masks;
  return base.map((m, i) => rotateMask(m, rotations[i] ?? 0));
}

export function isPipesSolved(p: PipesPublic, rotations: number[]): boolean {
  const wet = flow(p.size, currentMasks(p, rotations), p.source);
  return p.kinds.every((k, i) => k !== "house" || wet.has(i));
}

export function validatePipes(p: PipesPuzzle, solution: unknown): { ok: boolean; reason?: string } {
  const rotations = readRotations(p, solution);
  if (!rotations) return { ok: false, reason: "bad payload" };
  const ok = isPipesSolved(toPipesPublic(p), rotations);
  return ok ? { ok } : { ok, reason: "not every house has water" };
}

/** First wrong tile in flow order from the source, with the rotation that fixes it. */
export function pipesHint(p: PipesPuzzle, state: unknown): PipesHint | null {
  const rotations = readRotations(p, state) ?? new Array<number>(p.size * p.size).fill(0);
  const cur = currentMasks(p, rotations);
  if (isPipesSolved(toPipesPublic(p), rotations)) return { done: true };

  // walk the solved tree from the source so hints grow outward
  const order: number[] = [];
  const seen = new Set<number>([p.source]);
  const queue = [p.source];
  while (queue.length) {
    const cell = queue.shift()!;
    order.push(cell);
    for (const dir of [N, E, S, W]) {
      if (!(p.solution[cell] & dir)) continue;
      const nb = step(p.size, cell, dir);
      if (nb >= 0 && !seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  for (const cell of order) {
    if (cur[cell] === p.solution[cell]) continue;
    for (let r = 0; r < 4; r++) {
      if (rotateMask(p.initial[cell], r) === p.solution[cell]) return { cell, rotation: r };
    }
  }
  return null;
}
