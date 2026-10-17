/**
 * Game registry. Adding a game = one entry here plus a board component.
 * Everything else (home cards, daily set, set bonus, ranks) reads this list.
 */
import { Rng } from "./rng";
import { generateZip, toZipPublic, validateZip, zipHint, type ZipPuzzle } from "./zip";
import { generatePipes, toPipesPublic, validatePipes, pipesHint, type PipesPuzzle } from "./pipes";
import { flashHint, generateFlash, toFlashPublic, validateFlash, type FlashPuzzle } from "./flash";

export type GameId = "zip" | "pipes" | "flash";

export interface ValidateResult {
  ok: boolean;
  /** For count-based games: the number that is compared with par. */
  moves?: number;
  reason?: string;
}

export interface GameDef {
  id: GameId;
  name: string;
  /** One line under the name on the home card. */
  tagline: string;
  /** Short how-to shown under the board. */
  howTo: string;
  /** "time": par is seconds. "moves": par is a count compared with validate().moves. */
  parType: "time" | "moves";
  /** What the count is called, for "moves"-type games. */
  unit: "moves" | "mistakes";
  /** Seconds, for time-based games. */
  parSeconds?: number;
  /** Rough duration label for the home card. */
  estimate: string;
  generate(rng: Rng): unknown;
  toPublic(puzzle: unknown): unknown;
  validate(puzzle: unknown, solution: unknown): ValidateResult;
  hint(puzzle: unknown, state: unknown): unknown;
  /** Par for a specific puzzle: seconds or a count. */
  parOf(puzzle: unknown): number;
}

export const GAMES: GameDef[] = [
  {
    id: "zip",
    name: "Zip",
    tagline: "Draw one path through every box",
    howTo: "Press on 1 and drag. The path must visit every box once, pass the numbers in order, and end on the last number. Thick black lines are walls.",
    parType: "time",
    unit: "moves",
    parSeconds: 90,
    estimate: "about 1 min",
    generate: (rng) => generateZip(rng),
    toPublic: (p) => toZipPublic(p as ZipPuzzle),
    validate: (p, s) => validateZip(p as ZipPuzzle, s),
    hint: (p, s) => zipHint(p as ZipPuzzle, s),
    parOf: () => 90,
  },
  {
    id: "pipes",
    name: "Pipes",
    tagline: "Turn pipes so water reaches every house",
    howTo: "Water starts at the tank. Tap a pipe to turn it. Blue pipes are wet, grey pipes are dry. Done when every house turns green.",
    parType: "time",
    unit: "moves",
    parSeconds: 120,
    estimate: "about 2 min",
    generate: (rng) => generatePipes(rng),
    toPublic: (p) => toPipesPublic(p as PipesPuzzle),
    validate: (p, s) => validatePipes(p as PipesPuzzle, s),
    hint: (p, s) => pipesHint(p as PipesPuzzle, s),
    parOf: () => 120,
  },
  {
    id: "flash",
    name: "Flash",
    tagline: "Watch the tiles light up, tap them back in order",
    howTo: "Tiles light up one by one. Tap them in the same order. Each round adds one tile; there are 3 rounds. A wrong tap is a mistake and the round plays again. Watch again also costs a mistake.",
    parType: "moves",
    unit: "mistakes",
    estimate: "about 1 min",
    generate: (rng) => generateFlash(rng),
    toPublic: (p) => toFlashPublic(p as FlashPuzzle),
    validate: (p, s) => validateFlash(p as FlashPuzzle, s),
    hint: (p, s) => flashHint(p as FlashPuzzle, s),
    parOf: (p) => (p as FlashPuzzle).par,
  },
];

export const GAME_IDS = GAMES.map((g) => g.id);

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function isGameId(id: string): id is GameId {
  return GAMES.some((g) => g.id === id);
}

/** "1 mistake", "3 moves" */
export function countLabel(n: number, unit: "moves" | "mistakes"): string {
  if (unit === "mistakes") return `${n} ${n === 1 ? "mistake" : "mistakes"}`;
  return `${n} ${n === 1 ? "move" : "moves"}`;
}

/** Deterministic seed for a day's puzzle. The secret keeps tomorrow's puzzle private. */
export function dailySeed(secret: string, day: string, game: GameId): string {
  return `${secret}|${day}|${game}`;
}
