/**
 * The daily game flow: start, hint, submit. All scoring happens here, in transactions.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db/client";
import { accounts, dailyResults, type Account, type DailyResult } from "./db/schema";
import { GAMES, getGame, type GameId } from "./games";
import { getDailyPuzzle, isPlayableDay, toResultView, type ResultView } from "./daily";
import { COINS, nextStreak, streakBonus } from "./scoring";
import { credit, debit } from "./ledger";

export interface Failure {
  ok: false;
  error: string;
  status: number;
}

const fail = (error: string, status: number): Failure => ({ ok: false, error, status });

export interface StartOk {
  ok: true;
  result: ResultView;
}

export async function startGame(account: Account, day: string, gameId: GameId): Promise<StartOk | Failure> {
  if (!isPlayableDay(day, false)) return fail("That day is over", 400);
  await db.insert(dailyResults).values({ accountId: account.id, day, game: gameId }).onConflictDoNothing();
  const [row] = await db
    .select()
    .from(dailyResults)
    .where(and(eq(dailyResults.accountId, account.id), eq(dailyResults.day, day), eq(dailyResults.game, gameId)));
  return { ok: true, result: toResultView(row)! };
}

export interface HintOk {
  ok: true;
  hint: unknown;
  hintsUsed: number;
  charged: number;
  balance: number;
  freeLeft: number;
}

export async function requestHint(account: Account, day: string, gameId: GameId, state: unknown): Promise<HintOk | Failure> {
  if (!isPlayableDay(day, true)) return fail("That day is over", 400);
  const game = getGame(gameId)!;
  const puzzle = await getDailyPuzzle(day, gameId);

  return db.transaction(async (tx) => {
    const [acc] = await tx.select().from(accounts).where(eq(accounts.id, account.id)).for("update");
    await tx.insert(dailyResults).values({ accountId: acc.id, day, game: gameId }).onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(dailyResults)
      .where(and(eq(dailyResults.accountId, acc.id), eq(dailyResults.day, day), eq(dailyResults.game, gameId)))
      .for("update");
    if (row.solvedAt) return fail("Already solved", 409);

    const hint = game.hint(puzzle, state);
    if (hint && typeof hint === "object" && "done" in (hint as object)) {
      return { ok: true, hint, hintsUsed: row.hintsUsed, charged: 0, balance: acc.balance, freeLeft: Math.max(0, COINS.freeHints - row.hintsUsed) };
    }

    let charged = 0;
    let balance = acc.balance;
    if (row.hintsUsed >= COINS.freeHints) {
      const paid = await debit(tx, acc.id, COINS.hintCost, "hint", { day, game: gameId });
      if (!paid) return fail("Not enough coins for a hint", 402);
      charged = COINS.hintCost;
      balance -= charged;
    }
    const hintsUsed = row.hintsUsed + 1;
    await tx
      .update(dailyResults)
      .set({ hintsUsed })
      .where(and(eq(dailyResults.accountId, acc.id), eq(dailyResults.day, day), eq(dailyResults.game, gameId)));
    return { ok: true, hint, hintsUsed, charged, balance, freeLeft: Math.max(0, COINS.freeHints - hintsUsed) };
  });
}

export interface CoinLine {
  reason: "solve" | "under_par" | "full_set" | "streak";
  amount: number;
}

export interface SubmitOk {
  ok: true;
  result: ResultView;
  coins: CoinLine[];
  total: number;
  balance: number;
  setDone: boolean;
  solvedCount: number;
  totalGames: number;
  streak: number;
  usedShield: boolean;
  firstSolveEver: boolean;
}

export async function submitGame(account: Account, day: string, gameId: GameId, solution: unknown): Promise<SubmitOk | Failure> {
  if (!isPlayableDay(day, true)) return fail("That day is over", 400);
  const game = getGame(gameId)!;
  const puzzle = await getDailyPuzzle(day, gameId);

  return db.transaction(async (tx) => {
    const [acc] = await tx.select().from(accounts).where(eq(accounts.id, account.id)).for("update");
    const [row] = await tx
      .select()
      .from(dailyResults)
      .where(and(eq(dailyResults.accountId, acc.id), eq(dailyResults.day, day), eq(dailyResults.game, gameId)))
      .for("update");
    if (!row) return fail("Start the game first", 400);
    if (row.solvedAt) return fail("Already solved", 409);

    const verdict = game.validate(puzzle, solution);
    if (!verdict.ok) return fail(verdict.reason ?? "Not solved", 422);

    const now = new Date();
    const elapsedMs = Math.max(0, now.getTime() - row.startedAt.getTime());
    const par = game.parOf(puzzle);
    const beatPar = game.parType === "time" ? elapsedMs <= par * 1000 : (verdict.moves ?? Infinity) <= par;
    const underPar = row.hintsUsed === 0 && beatPar;

    const [updated] = await tx
      .update(dailyResults)
      .set({ solvedAt: now, elapsedMs, moves: verdict.moves ?? null, underPar })
      .where(and(eq(dailyResults.accountId, acc.id), eq(dailyResults.day, day), eq(dailyResults.game, gameId)))
      .returning();

    const coins: CoinLine[] = [];
    await credit(tx, acc.id, COINS.solve, "solve", { day, game: gameId });
    coins.push({ reason: "solve", amount: COINS.solve });
    if (underPar) {
      await credit(tx, acc.id, COINS.underPar, "under_par", { day, game: gameId });
      coins.push({ reason: "under_par", amount: COINS.underPar });
    }

    const [{ solvedCount }] = await tx
      .select({ solvedCount: sql<number>`count(*)::int` })
      .from(dailyResults)
      .where(and(eq(dailyResults.accountId, acc.id), eq(dailyResults.day, day), sql`${dailyResults.solvedAt} is not null`));

    const setDone = solvedCount >= GAMES.length;
    let streak = acc.streak;
    let usedShield = false;
    if (setDone) {
      await credit(tx, acc.id, COINS.fullSet, "full_set", { day });
      coins.push({ reason: "full_set", amount: COINS.fullSet });
      const next = nextStreak(
        { streak: acc.streak, bestStreak: acc.bestStreak, lastFullDay: acc.lastFullDay, shieldWeek: acc.shieldWeek },
        day,
      );
      if (next.changed) {
        await tx
          .update(accounts)
          .set({ streak: next.streak, bestStreak: next.bestStreak, lastFullDay: next.lastFullDay, shieldWeek: next.shieldWeek })
          .where(eq(accounts.id, acc.id));
        const bonus = streakBonus(next.streak);
        await credit(tx, acc.id, bonus, "streak", { day });
        coins.push({ reason: "streak", amount: bonus });
      }
      streak = next.streak;
      usedShield = next.usedShield;
    }

    const [{ everCount }] = await tx
      .select({ everCount: sql<number>`count(*)::int` })
      .from(dailyResults)
      .where(and(eq(dailyResults.accountId, acc.id), sql`${dailyResults.solvedAt} is not null`));

    const [fresh] = await tx.select({ balance: accounts.balance }).from(accounts).where(eq(accounts.id, acc.id));
    const total = coins.reduce((s, c) => s + c.amount, 0);

    return {
      ok: true,
      result: toResultView(updated as DailyResult)!,
      coins,
      total,
      balance: fresh.balance,
      setDone,
      solvedCount,
      totalGames: GAMES.length,
      streak,
      usedShield,
      firstSolveEver: everCount === 1,
    };
  });
}
