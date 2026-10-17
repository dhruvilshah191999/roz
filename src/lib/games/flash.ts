/**
 * Flash: tiles light up in order, tap them back in the same order.
 * Round r shows the first (startLen + r - 1) tiles of one fixed sequence.
 * A wrong tap is a mistake and the round is tried again. Par is counted in mistakes.
 *
 * The sequence has to reach the client to be shown, so it is not a secret.
 * The server still replays every attempt to decide solved and count mistakes.
 */
import { Rng } from "./rng";

export interface FlashPuzzle {
  size: number;
  sequence: number[];
  rounds: number;
  startLen: number;
  /** mistakes allowed for the under-par bonus */
  par: number;
}

export type FlashPublic = FlashPuzzle;

export type FlashHint = { cell: number } | { done: true };

export function roundLength(p: FlashPuzzle, round: number): number {
  return p.startLen + round - 1;
}

export function generateFlash(rng: Rng, size = 3, rounds = 3, startLen = 3): FlashPuzzle {
  const n = size * size;
  const total = startLen + rounds - 1;
  const sequence: number[] = [];
  while (sequence.length < total) {
    const cell = rng.int(n);
    // no tile twice in a row, so each flash is visible as a separate step
    if (sequence.length && sequence[sequence.length - 1] === cell) continue;
    sequence.push(cell);
  }
  return { size, sequence, rounds, startLen, par: 1 };
}

export function toFlashPublic(p: FlashPuzzle): FlashPublic {
  return p;
}

function readAttempts(p: FlashPuzzle, state: unknown): number[][] | null {
  const raw = (state as { attempts?: unknown } | null)?.attempts;
  const n = p.size * p.size;
  if (!Array.isArray(raw) || raw.length > 300) return null;
  for (const a of raw) {
    if (!Array.isArray(a) || a.length > p.sequence.length) return null;
    if (!a.every((c) => Number.isInteger(c) && c >= 0 && c < n)) return null;
  }
  return raw as number[][];
}

export interface FlashProgress {
  /** 1-based round the player is on; rounds + 1 means solved */
  round: number;
  mistakes: number;
  solved: boolean;
}

/** Replay attempts in order. An attempt that is not exactly the round's prefix is a mistake. */
export function replayFlash(p: FlashPuzzle, attempts: number[][]): FlashProgress {
  let round = 1;
  let mistakes = 0;
  for (const attempt of attempts) {
    if (round > p.rounds) break;
    const len = roundLength(p, round);
    const expected = p.sequence.slice(0, len);
    const ok = attempt.length === len && attempt.every((c, i) => c === expected[i]);
    if (ok) round++;
    else mistakes++;
  }
  return { round, mistakes, solved: round > p.rounds };
}

export function validateFlash(p: FlashPuzzle, solution: unknown): { ok: boolean; moves?: number; reason?: string } {
  const attempts = readAttempts(p, solution);
  if (!attempts) return { ok: false, reason: "bad payload" };
  const prog = replayFlash(p, attempts);
  if (!prog.solved) return { ok: false, reason: `only reached round ${prog.round}` };
  return { ok: true, moves: prog.mistakes };
}

/** The next tile to tap, given the attempts so far and the taps made in the current round. */
export function flashHint(p: FlashPuzzle, state: unknown): FlashHint {
  const attempts = readAttempts(p, state) ?? [];
  const prog = replayFlash(p, attempts);
  if (prog.solved) return { done: true };
  const rawTaps = (state as { taps?: unknown } | null)?.taps;
  const taps = Array.isArray(rawTaps) ? (rawTaps as number[]) : [];
  const len = roundLength(p, prog.round);
  const expected = p.sequence.slice(0, len);
  // find the first position where the current taps diverge, or the next untapped position
  let i = 0;
  while (i < taps.length && i < len && taps[i] === expected[i]) i++;
  return { cell: expected[Math.min(i, len - 1)] };
}
