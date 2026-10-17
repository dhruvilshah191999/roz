/**
 * Zip: draw one path from 1 to N through every cell, visiting the numbers
 * in order, never crossing a wall.
 *
 * Cells are indexed row-major: index = row * size + col.
 * Walls are pairs [a, b] with a < b of adjacent cells the path may not cross.
 */
import { Rng } from "./rng";

export interface ZipPuzzle {
  size: number;
  /** numbers[k] is the cell index that shows the number k + 1. */
  numbers: number[];
  walls: number[][];
  /** One valid path, used for generation and hint fallback. Never sent to the client. */
  solution: number[];
}

export type ZipPublic = Omit<ZipPuzzle, "solution">;

export type ZipHint = { next: number } | { keep: number } | { done: true };

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function wallKey(a: number, b: number): number {
  return a < b ? a * 10000 + b : b * 10000 + a;
}

export function neighbors(size: number, cell: number): number[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(nr * size + nc);
  }
  return out;
}

export function isAdjacent(size: number, a: number, b: number): boolean {
  const ra = Math.floor(a / size);
  const ca = a % size;
  const rb = Math.floor(b / size);
  const cb = b % size;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

function wallSetOf(walls: number[][]): Set<number> {
  return new Set(walls.map(([a, b]) => wallKey(a, b)));
}

/** Random Hamiltonian path using Warnsdorff ordering with backtracking. */
function randomHamiltonianPath(size: number, rng: Rng, nodeCap = 60000): number[] | null {
  const n = size * size;
  const visited = new Uint8Array(n);
  const path: number[] = [];
  let nodes = 0;

  const freeDegree = (cell: number): number => {
    let d = 0;
    for (const nb of neighbors(size, cell)) if (!visited[nb]) d++;
    return d;
  };

  const dfs = (cell: number): boolean => {
    if (++nodes > nodeCap) return false;
    visited[cell] = 1;
    path.push(cell);
    if (path.length === n) return true;
    const scored = neighbors(size, cell)
      .filter((x) => !visited[x])
      .map((x) => ({ x, d: freeDegree(x), r: rng.next() }))
      // a cell with no free onward neighbour is only usable as the final cell
      .filter((s) => s.d > 0 || path.length === n - 1)
      .sort((a, b) => a.d - b.d || a.r - b.r);
    for (const { x } of scored) {
      if (dfs(x)) return true;
      if (nodes > nodeCap) return false;
    }
    visited[cell] = 0;
    path.pop();
    return false;
  };

  for (let attempt = 0; attempt < 30; attempt++) {
    nodes = 0;
    visited.fill(0);
    path.length = 0;
    if (dfs(rng.int(n))) return path.slice();
  }
  return null;
}

interface SolveResult {
  solutions: number[][];
  capped: boolean;
}

/**
 * Depth-first search for paths that extend `prefix` into a full solution.
 * Stops after `limit` solutions or `nodeCap` nodes.
 */
function solve(puzzle: ZipPublic, prefix: number[], limit: number, nodeCap: number): SolveResult {
  const { size, numbers } = puzzle;
  const n = size * size;
  const walls = wallSetOf(puzzle.walls);
  const numberAt = new Map<number, number>();
  numbers.forEach((cell, i) => numberAt.set(cell, i));
  const lastNumberCell = numbers[numbers.length - 1];

  const visited = new Uint8Array(n);
  const path = prefix.slice();
  let expected = 0;
  for (const cell of path) {
    visited[cell] = 1;
    if (numberAt.get(cell) === expected) expected++;
  }
  const solutions: number[][] = [];
  let nodes = 0;
  let capped = false;

  const isDeadNeighbour = (x: number, head: number): boolean => {
    // x is unvisited; it is dead if it has no unvisited neighbour and is not next to the head
    if (isAdjacent(size, x, head) && !walls.has(wallKey(x, head))) return false;
    for (const nb of neighbors(size, x)) {
      if (!visited[nb] && !walls.has(wallKey(x, nb))) return false;
    }
    return true;
  };

  const dfs = (head: number, prev: number): boolean => {
    if (path.length === n) {
      if (head === lastNumberCell) solutions.push(path.slice());
      return solutions.length >= limit;
    }
    if (++nodes > nodeCap) {
      capped = true;
      return true;
    }
    // prune: cells that just lost their last free neighbour
    if (prev >= 0) {
      for (const x of neighbors(size, prev)) {
        if (!visited[x] && isDeadNeighbour(x, head)) return false;
      }
    }
    for (const nb of neighbors(size, head)) {
      if (visited[nb] || walls.has(wallKey(head, nb))) continue;
      const numIdx = numberAt.get(nb);
      if (numIdx !== undefined) {
        if (numIdx !== expected) continue;
        if (nb === lastNumberCell && path.length !== n - 1) continue;
      }
      visited[nb] = 1;
      path.push(nb);
      if (numIdx !== undefined) expected++;
      const stop = dfs(nb, head);
      if (numIdx !== undefined) expected--;
      path.pop();
      visited[nb] = 0;
      if (stop) return true;
    }
    return false;
  };

  if (path.length === 0) {
    const start = numbers[0];
    visited[start] = 1;
    path.push(start);
    expected = 1;
    dfs(start, -1);
  } else {
    dfs(path[path.length - 1], path.length > 1 ? path[path.length - 2] : -1);
  }
  return { solutions, capped };
}

export interface ZipGenerateOptions {
  size?: number;
  checkpoints?: number;
  maxWalls?: number;
  solverNodeCap?: number;
}

export function generateZip(rng: Rng, opts: ZipGenerateOptions = {}): ZipPuzzle {
  const size = opts.size ?? 6;
  const checkpoints = opts.checkpoints ?? 6;
  const maxWalls = opts.maxWalls ?? 12;
  const nodeCap = opts.solverNodeCap ?? 200000;

  const path = randomHamiltonianPath(size, rng);
  if (!path) throw new Error("zip: could not generate a path");
  const n = path.length;

  // checkpoints: first, last, and (checkpoints - 2) interior positions kept apart
  const interior = checkpoints - 2;
  const positions = new Set<number>([0, n - 1]);
  const minGap = Math.max(2, Math.floor(n / (checkpoints + 1)));
  let guard = 0;
  while (positions.size < checkpoints && guard++ < 500) {
    const p = 1 + rng.int(n - 2);
    let ok = true;
    for (const q of positions) if (Math.abs(p - q) < minGap) ok = false;
    if (ok) positions.add(p);
  }
  // if spacing was too strict, relax it
  while (positions.size < checkpoints) positions.add(1 + rng.int(n - 2));
  void interior;
  const sorted = Array.from(positions).sort((a, b) => a - b);
  const numbers = sorted.map((p) => path[p]);

  // candidate walls: adjacent pairs the solution path does not use
  const used = new Set<number>();
  for (let i = 0; i + 1 < path.length; i++) used.add(wallKey(path[i], path[i + 1]));
  const candidates: number[][] = [];
  for (let cell = 0; cell < n; cell++) {
    for (const nb of neighbors(size, cell)) {
      if (nb > cell && !used.has(wallKey(cell, nb))) candidates.push([cell, nb]);
    }
  }
  const shuffled = rng.shuffle(candidates);

  const walls: number[][] = [];
  const pub = (): ZipPublic => ({ size, numbers, walls: walls.slice() });
  let res = solve(pub(), [], 2, nodeCap);
  let idx = 0;
  while (!(res.solutions.length === 1 && !res.capped) && walls.length < maxWalls && idx < shuffled.length) {
    walls.push(shuffled[idx++]);
    res = solve(pub(), [], 2, nodeCap);
  }

  return { size, numbers, walls, solution: path };
}

export function toZipPublic(p: ZipPuzzle): ZipPublic {
  return { size: p.size, numbers: p.numbers, walls: p.walls };
}

export interface ZipCheck {
  ok: boolean;
  /** Length of the longest valid prefix. */
  validPrefix: number;
  reason?: string;
}

/**
 * Validates a path. With `complete = true` it must cover every cell and end on the last number.
 * Always reports the longest valid prefix so the UI and hints can trim a wrong path.
 */
export function checkZipPath(puzzle: ZipPublic, path: number[], complete: boolean): ZipCheck {
  const { size, numbers } = puzzle;
  const n = size * size;
  const walls = wallSetOf(puzzle.walls);
  const numberAt = new Map<number, number>();
  numbers.forEach((cell, i) => numberAt.set(cell, i));
  const lastNumberCell = numbers[numbers.length - 1];
  const seen = new Set<number>();
  let expected = 0;

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (!Number.isInteger(cell) || cell < 0 || cell >= n) return { ok: false, validPrefix: i, reason: "bad cell" };
    if (seen.has(cell)) return { ok: false, validPrefix: i, reason: "cell repeated" };
    if (i === 0) {
      if (cell !== numbers[0]) return { ok: false, validPrefix: 0, reason: "must start at 1" };
    } else {
      const prev = path[i - 1];
      if (!isAdjacent(size, prev, cell)) return { ok: false, validPrefix: i, reason: "not adjacent" };
      if (walls.has(wallKey(prev, cell))) return { ok: false, validPrefix: i, reason: "wall" };
    }
    const numIdx = numberAt.get(cell);
    if (numIdx !== undefined) {
      if (numIdx !== expected) return { ok: false, validPrefix: i, reason: "numbers out of order" };
      if (cell === lastNumberCell && i !== n - 1) return { ok: false, validPrefix: i, reason: "last number must be the final cell" };
      expected++;
    }
    seen.add(cell);
  }

  if (complete) {
    if (path.length !== n) return { ok: false, validPrefix: path.length, reason: "path must cover every cell" };
    if (expected !== numbers.length) return { ok: false, validPrefix: path.length, reason: "not all numbers visited" };
  }
  return { ok: true, validPrefix: path.length };
}

export function validateZip(puzzle: ZipPuzzle, solution: unknown): { ok: boolean; reason?: string } {
  const path = (solution as { path?: unknown } | null)?.path;
  if (!Array.isArray(path) || path.length > puzzle.size * puzzle.size) return { ok: false, reason: "bad payload" };
  const res = checkZipPath(puzzle, path as number[], true);
  return { ok: res.ok, reason: res.reason };
}

/** Next correct cell for the current path, or how many cells to keep if the path is wrong. */
export function zipHint(puzzle: ZipPuzzle, state: unknown): ZipHint {
  const raw = (state as { path?: unknown } | null)?.path;
  const path = Array.isArray(raw) ? (raw as number[]) : [];
  const n = puzzle.size * puzzle.size;
  const pub = toZipPublic(puzzle);

  const check = checkZipPath(pub, path, false);
  if (!check.ok) return { keep: check.validPrefix };
  if (path.length === n) return { done: true };
  if (path.length === 0) return { next: puzzle.numbers[0] };

  const res = solve(pub, path, 1, 150000);
  if (res.solutions.length > 0) return { next: res.solutions[0][path.length] };

  // dead end (or solver capped): fall back to the generator's path
  let common = 0;
  while (common < path.length && path[common] === puzzle.solution[common]) common++;
  if (common === path.length) return { next: puzzle.solution[common] };
  return { keep: common };
}
