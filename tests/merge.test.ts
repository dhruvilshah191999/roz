import { describe, expect, it } from "vitest";
import { isBetter, planMerge, type MergeLedgerRow, type MergeResult } from "@/lib/merge";

const day = "2026-10-17";
let nextId = 1;
const row = (reason: string, amount: number, refGame: string | null = null, refDay: string | null = day): MergeLedgerRow => ({
  id: nextId++,
  amount,
  reason,
  refDay,
  refGame,
});
const solved = (game: string, elapsedMs: number, moves = 5): MergeResult => ({ day, game, solved: true, elapsedMs, moves });
const parTypeOf = (game: string) => (game === "flash" ? "moves" : "time") as "time" | "moves";

/** All three games solved: 10 each, plus 15 for the set and 2 for the streak. */
function fullDayRows() {
  return [row("solve", 10, "zip"), row("solve", 10, "pipes"), row("solve", 10, "flash"), row("full_set", 15), row("streak", 2)];
}

describe("isBetter", () => {
  it("a solve beats no solve, and the faster time wins", () => {
    expect(isBetter(solved("zip", 50000), undefined, "time")).toBe(true);
    expect(isBetter(solved("zip", 50000), { ...solved("zip", 1), solved: false }, "time")).toBe(true);
    expect(isBetter(solved("zip", 40000), solved("zip", 50000), "time")).toBe(true);
    expect(isBetter(solved("zip", 50000), solved("zip", 50000), "time")).toBe(false);
  });

  it("moves games compare moves first, then time", () => {
    expect(isBetter(solved("flash", 90000, 1), solved("flash", 30000, 2), "moves")).toBe(true);
    expect(isBetter(solved("flash", 20000, 2), solved("flash", 30000, 2), "moves")).toBe(true);
    expect(isBetter(solved("flash", 20000, 3), solved("flash", 30000, 2), "moves")).toBe(false);
  });
});

describe("restore merge", () => {
  it("keeps the restored account's results and coins when they are better", () => {
    const aRows = fullDayRows();
    const bRows = fullDayRows();
    const plan = planMerge({
      aRows,
      bRows,
      aResults: [solved("zip", 30000), solved("pipes", 30000), solved("flash", 30000, 1)],
      bResults: [solved("zip", 60000), solved("pipes", 60000), solved("flash", 60000, 2)],
      parTypeOf,
    });
    expect(plan.takeFromB.size).toBe(0);
    expect(plan.dropIds).toEqual(bRows.map((r) => r.id));
    expect(plan).toMatchObject({ balanceDelta: 0, lifetimeDelta: 0 });
  });

  it("takes the faster time from the other browser, with its rewards instead of the old ones", () => {
    const aRows = [row("solve", 10, "zip"), row("hint", -5, "zip")];
    const bRows = [row("solve", 10, "zip"), row("under_par", 5, "zip")];
    const plan = planMerge({ aRows, bRows, aResults: [solved("zip", 90000)], bResults: [solved("zip", 40000)], parTypeOf });
    expect([...plan.takeFromB]).toEqual([`${day}|zip`]);
    // A's solve reward goes, A's hint cost stays, B's rewards come in.
    expect(plan.dropIds).toEqual([aRows[0].id]);
    expect(plan.balanceDelta).toBe(5);
    expect(plan.lifetimeDelta).toBe(5);
  });

  it("pays the full-set and streak bonus once per day", () => {
    const aRows = fullDayRows();
    const bRows = fullDayRows();
    const plan = planMerge({
      aRows,
      bRows,
      aResults: [solved("zip", 30000), solved("pipes", 90000), solved("flash", 30000, 1)],
      bResults: [solved("zip", 60000), solved("pipes", 40000), solved("flash", 60000, 2)],
      parTypeOf,
    });
    expect([...plan.takeFromB]).toEqual([`${day}|pipes`]);
    expect(plan.balanceDelta).toBe(0);
  });

  it("moves everything when the restored account did not play", () => {
    const plan = planMerge({
      aRows: [],
      bRows: [...fullDayRows(), row("hint", -5, "pipes")],
      aResults: [],
      bResults: [solved("zip", 1), solved("pipes", 1), solved("flash", 1)],
      parTypeOf,
    });
    expect(plan.dropIds).toEqual([]);
    expect(plan.balanceDelta).toBe(42);
    expect(plan.lifetimeDelta).toBe(47);
  });

  it("keeps other days and redemptions, which can leave a negative change", () => {
    const bRows = [row("solve", 10, "zip", "2026-10-16"), row("solve", 10, "zip"), row("redeem", -100, null, null)];
    const plan = planMerge({
      aRows: [row("solve", 10, "zip")],
      bRows,
      aResults: [solved("zip", 30000)],
      bResults: [{ ...solved("zip", 1), day: "2026-10-16" }, solved("zip", 60000)],
      parTypeOf,
    });
    expect(plan.dropIds).toEqual([bRows[1].id]);
    expect(plan.balanceDelta).toBe(-90);
    expect(plan.lifetimeDelta).toBe(10);
  });
});
