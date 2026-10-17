/**
 * Rules for merging a throwaway account (B) into a restored account (A).
 *
 * Each puzzle keeps one result: the better of the two attempts. A solve beats
 * no solve. Between two solves, time games keep the faster one and moves games
 * keep the one with fewer moves, then the faster one. A tie keeps A's.
 *
 * Coins follow the result that is kept: the losing attempt's solve and
 * under-par rewards are dropped. Hint costs always stay, since they were spent.
 * The full-set and streak bonus pay once per day: if A already has them, B's
 * are dropped. Everything else (other days, redemptions, weekly prizes) moves.
 */

export interface MergeLedgerRow {
  id: number;
  amount: number;
  reason: string;
  refDay: string | null;
  refGame: string | null;
}

export interface MergeResult {
  day: string;
  game: string;
  solved: boolean;
  elapsedMs: number | null;
  moves: number | null;
}

export interface MergePlan {
  /** day|game keys where B's result replaces A's (or fills a gap). */
  takeFromB: Set<string>;
  dropIds: number[];
  /** Change to A's balance after the merge. Can be negative. */
  balanceDelta: number;
  /** Change to A's lifetime total: only positive rows count, as in credit(). */
  lifetimeDelta: number;
}

const REWARD = new Set(["solve", "under_par"]);
const PER_DAY = new Set(["full_set", "streak"]);

export function puzzleKey(day: string, game: string): string {
  return `${day}|${game}`;
}

/** True if attempt `b` is strictly better than attempt `a`. */
export function isBetter(b: MergeResult, a: MergeResult | undefined, parType: "time" | "moves"): boolean {
  if (!b.solved) return false;
  if (!a || !a.solved) return true;
  const bt = b.elapsedMs ?? Infinity;
  const at = a.elapsedMs ?? Infinity;
  if (parType === "moves") {
    const bm = b.moves ?? Infinity;
    const am = a.moves ?? Infinity;
    if (bm !== am) return bm < am;
  }
  return bt < at;
}

export function planMerge(input: {
  aRows: MergeLedgerRow[];
  bRows: MergeLedgerRow[];
  aResults: MergeResult[];
  bResults: MergeResult[];
  parTypeOf: (game: string) => "time" | "moves";
}): MergePlan {
  const aByKey = new Map(input.aResults.map((r) => [puzzleKey(r.day, r.game), r]));
  const bByKey = new Map(input.bResults.map((r) => [puzzleKey(r.day, r.game), r]));

  const takeFromB = new Set<string>();
  for (const [key, b] of bByKey) {
    const a = aByKey.get(key);
    if (!a || isBetter(b, a, input.parTypeOf(b.game))) takeFromB.add(key);
  }

  /** Which side's reward for this puzzle is kept. */
  const rewardOwner = (key: string): "a" | "b" => {
    if (takeFromB.has(key)) return "b";
    return aByKey.get(key)?.solved ? "a" : "b";
  };
  const aFullSetDays = new Set(input.aRows.filter((r) => r.reason === "full_set" && r.refDay).map((r) => r.refDay!));

  const dropIds: number[] = [];
  let balanceDelta = 0;
  let lifetimeDelta = 0;

  for (const row of input.aRows) {
    if (REWARD.has(row.reason) && row.refDay && row.refGame && rewardOwner(puzzleKey(row.refDay, row.refGame)) === "b") {
      dropIds.push(row.id);
      balanceDelta -= row.amount;
      if (row.amount > 0) lifetimeDelta -= row.amount;
    }
  }
  for (const row of input.bRows) {
    const dropReward = REWARD.has(row.reason) && row.refDay && row.refGame && rewardOwner(puzzleKey(row.refDay, row.refGame)) === "a";
    const dropDayBonus = PER_DAY.has(row.reason) && row.refDay && aFullSetDays.has(row.refDay);
    if (dropReward || dropDayBonus) {
      dropIds.push(row.id);
      continue;
    }
    balanceDelta += row.amount;
    if (row.amount > 0) lifetimeDelta += row.amount;
  }
  return { takeFromB, dropIds, balanceDelta, lifetimeDelta };
}
