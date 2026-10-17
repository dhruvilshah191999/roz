import { and, eq } from "drizzle-orm";
import { db } from "./db/client";
import { dailyPuzzles, dailyResults, type DailyResult } from "./db/schema";
import { GAMES, dailySeed, getGame, type GameId } from "./games";
import { Rng } from "./games/rng";
import { dayInIST, addDays } from "./scoring";

const cache = new Map<string, unknown>();

function seedSecret(): string {
  return process.env.DAILY_SEED_SECRET ?? "roz-dev-seed";
}

/** Full puzzle (with solution) for a day and game, generated once and stored. */
export async function getDailyPuzzle(day: string, gameId: GameId): Promise<unknown> {
  const key = `${day}|${gameId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const found = await db
    .select({ puzzle: dailyPuzzles.puzzle })
    .from(dailyPuzzles)
    .where(and(eq(dailyPuzzles.day, day), eq(dailyPuzzles.game, gameId)))
    .limit(1);
  if (found[0]) {
    cache.set(key, found[0].puzzle);
    return found[0].puzzle;
  }

  const game = getGame(gameId)!;
  const puzzle = game.generate(new Rng(dailySeed(seedSecret(), day, gameId)));
  await db.insert(dailyPuzzles).values({ day, game: gameId, puzzle }).onConflictDoNothing();
  const again = await db
    .select({ puzzle: dailyPuzzles.puzzle })
    .from(dailyPuzzles)
    .where(and(eq(dailyPuzzles.day, day), eq(dailyPuzzles.game, gameId)))
    .limit(1);
  const stored = again[0]?.puzzle ?? puzzle;
  cache.set(key, stored);
  return stored;
}

export interface ResultView {
  startedAt: string;
  solvedAt: string | null;
  elapsedMs: number | null;
  moves: number | null;
  hintsUsed: number;
  underPar: boolean;
}

export function toResultView(r: DailyResult | null | undefined): ResultView | null {
  if (!r) return null;
  return {
    startedAt: r.startedAt.toISOString(),
    solvedAt: r.solvedAt ? r.solvedAt.toISOString() : null,
    elapsedMs: r.elapsedMs,
    moves: r.moves,
    hintsUsed: r.hintsUsed,
    underPar: r.underPar,
  };
}

export async function getDayResults(accountId: string | null, day: string): Promise<Map<string, DailyResult>> {
  const map = new Map<string, DailyResult>();
  if (!accountId) return map;
  const rows = await db
    .select()
    .from(dailyResults)
    .where(and(eq(dailyResults.accountId, accountId), eq(dailyResults.day, day)));
  for (const r of rows) map.set(r.game, r);
  return map;
}

export interface DailyGameView {
  id: GameId;
  name: string;
  tagline: string;
  howTo: string;
  parType: "time" | "moves";
  unit: "moves" | "mistakes";
  par: number;
  estimate: string;
  puzzle: unknown;
  result: ResultView | null;
}

export interface DailyView {
  day: string;
  games: DailyGameView[];
  solvedCount: number;
  total: number;
}

/** Everything the home page and play page need for a day. Solutions stripped. */
export async function getDailyView(accountId: string | null, day = dayInIST()): Promise<DailyView> {
  const results = await getDayResults(accountId, day);
  const games: DailyGameView[] = [];
  for (const g of GAMES) {
    const full = await getDailyPuzzle(day, g.id);
    games.push({
      id: g.id,
      name: g.name,
      tagline: g.tagline,
      howTo: g.howTo,
      parType: g.parType,
      unit: g.unit,
      par: g.parOf(full),
      estimate: g.estimate,
      puzzle: g.toPublic(full),
      result: toResultView(results.get(g.id)),
    });
  }
  const solvedCount = games.filter((g) => g.result?.solvedAt).length;
  return { day, games, solvedCount, total: GAMES.length };
}

/** Days a client may act on: today, or yesterday for a game started before midnight. */
export function isPlayableDay(day: string, allowYesterday: boolean): boolean {
  const today = dayInIST();
  if (day === today) return true;
  return allowYesterday && day === addDays(today, -1);
}
