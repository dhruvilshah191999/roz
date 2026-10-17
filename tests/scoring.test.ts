import { describe, expect, it } from "vitest";
import { addDays, formatElapsed, isoWeek, levelFor, nextStreak, streakAlive, streakBonus, weekRange } from "@/lib/scoring";

describe("scoring", () => {
  it("levels follow the thresholds", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(199).level).toBe(1);
    expect(levelFor(200).level).toBe(2);
    expect(levelFor(1240)).toMatchObject({ level: 4, current: 1000, next: 2000 });
    expect(levelFor(8000).level).toBe(8);
    expect(levelFor(11000).level).toBe(9);
    expect(levelFor(11000).next).toBe(14000);
  });

  it("streak bonus is capped", () => {
    expect(streakBonus(1)).toBe(2);
    expect(streakBonus(10)).toBe(20);
    expect(streakBonus(50)).toBe(20);
  });

  it("date helpers", () => {
    expect(addDays("2026-10-13", 1)).toBe("2026-10-14");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(isoWeek("2026-10-13")).toBe("2026-W42");
    expect(weekRange("2026-10-13")).toEqual({ start: "2026-10-12", end: "2026-10-18" });
    expect(weekRange("2026-10-18")).toEqual({ start: "2026-10-12", end: "2026-10-18" });
    expect(formatElapsed(48000)).toBe("0:48");
    expect(formatElapsed(90500)).toBe("1:31");
  });

  it("streak continues on consecutive days", () => {
    const s = nextStreak({ streak: 3, bestStreak: 5, lastFullDay: "2026-10-12", shieldWeek: null }, "2026-10-13");
    expect(s).toMatchObject({ streak: 4, bestStreak: 5, lastFullDay: "2026-10-13", changed: true, usedShield: false });
  });

  it("streak uses the shield once per week", () => {
    const s = nextStreak({ streak: 3, bestStreak: 3, lastFullDay: "2026-10-11", shieldWeek: null }, "2026-10-13");
    expect(s).toMatchObject({ streak: 4, bestStreak: 4, usedShield: true, shieldWeek: "2026-W42" });
    const again = nextStreak({ ...s, lastFullDay: "2026-10-13" }, "2026-10-15");
    expect(again).toMatchObject({ streak: 1, usedShield: false });
  });

  it("streak resets after two missed days and is idempotent on the same day", () => {
    const s = nextStreak({ streak: 9, bestStreak: 9, lastFullDay: "2026-10-09", shieldWeek: null }, "2026-10-13");
    expect(s.streak).toBe(1);
    const same = nextStreak({ streak: 4, bestStreak: 4, lastFullDay: "2026-10-13", shieldWeek: null }, "2026-10-13");
    expect(same.changed).toBe(false);
    expect(same.streak).toBe(4);
  });

  it("streakAlive", () => {
    expect(streakAlive({ streak: 2, bestStreak: 2, lastFullDay: "2026-10-12", shieldWeek: null }, "2026-10-13")).toBe(true);
    expect(streakAlive({ streak: 2, bestStreak: 2, lastFullDay: "2026-10-11", shieldWeek: null }, "2026-10-13")).toBe(true);
    expect(streakAlive({ streak: 2, bestStreak: 2, lastFullDay: "2026-10-11", shieldWeek: "2026-W42" }, "2026-10-13")).toBe(false);
    expect(streakAlive({ streak: 0, bestStreak: 0, lastFullDay: null, shieldWeek: null }, "2026-10-13")).toBe(false);
  });
});
