/**
 * Coin rules, streaks, levels and date helpers. Pure functions, no I/O.
 * Puzzle days are calendar dates in Asia/Kolkata (YYYY-MM-DD).
 */

export const COINS = {
  solve: 10,
  underPar: 5,
  fullSet: 15,
  streakPerDay: 2,
  streakCap: 20,
  hintCost: 5,
  freeHints: 2,
  weeklyTop3: 100,
} as const;

/** 100 coins = ₹1 */
export const COINS_PER_RUPEE = 100;

export const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000];
const LEVEL_STEP_AFTER = 3000;

export interface LevelInfo {
  level: number;
  current: number;
  next: number;
  /** 0..1 progress towards next level */
  progress: number;
}

export function levelFor(lifetime: number): LevelInfo {
  let level = 1;
  let current = 0;
  let next = LEVEL_THRESHOLDS[1];
  for (let i = 1; ; i++) {
    const threshold = i < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[i]
      : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (i - LEVEL_THRESHOLDS.length + 1) * LEVEL_STEP_AFTER;
    if (lifetime >= threshold) {
      level = i + 1;
      current = threshold;
    } else {
      next = threshold;
      break;
    }
  }
  const span = next - current;
  return { level, current, next, progress: span > 0 ? Math.min(1, (lifetime - current) / span) : 1 };
}

export function streakBonus(streak: number): number {
  return Math.min(COINS.streakCap, COINS.streakPerDay * streak);
}

// ---------- dates ----------

const IST = "Asia/Kolkata";

/** YYYY-MM-DD for `now` in IST. */
export function dayInIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** ISO week id like 2026-W42. */
export function isoWeek(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday..Sunday containing `day`. */
export function weekRange(day: string): { start: string; end: string } {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  const start = addDays(day, 1 - dayNum);
  return { start, end: addDays(start, 6) };
}

/** Human date like "Monday, 13 October" in IST. */
export function formatDayLong(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(date);
}

export function formatDayShort(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

// ---------- streak ----------

export interface StreakState {
  streak: number;
  bestStreak: number;
  lastFullDay: string | null;
  /** ISO week in which the shield was used, or null. */
  shieldWeek: string | null;
}

export interface StreakUpdate extends StreakState {
  changed: boolean;
  usedShield: boolean;
}

/**
 * Called when a full set is completed for `today`.
 * Consecutive day → +1. One missed day with a shield available this week → +1 and shield used.
 * Otherwise the streak restarts at 1. Same day again → unchanged.
 */
export function nextStreak(state: StreakState, today: string): StreakUpdate {
  const base: StreakUpdate = { ...state, changed: false, usedShield: false };
  if (state.lastFullDay === today) return base;

  const week = isoWeek(today);
  let streak: number;
  let usedShield = false;
  let shieldWeek = state.shieldWeek;

  if (state.lastFullDay === addDays(today, -1)) {
    streak = state.streak + 1;
  } else if (state.lastFullDay === addDays(today, -2) && state.shieldWeek !== week) {
    streak = state.streak + 1;
    usedShield = true;
    shieldWeek = week;
  } else {
    streak = 1;
  }
  return {
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastFullDay: today,
    shieldWeek,
    changed: true,
    usedShield,
  };
}

/** Is the streak still alive as of `today` (before playing)? */
export function streakAlive(state: StreakState, today: string): boolean {
  if (!state.lastFullDay) return false;
  if (state.lastFullDay === today || state.lastFullDay === addDays(today, -1)) return true;
  return state.lastFullDay === addDays(today, -2) && state.shieldWeek !== isoWeek(today);
}

// ---------- formatting ----------

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatCoins(n: number): string {
  return n.toLocaleString("en-IN");
}

export function rupees(coins: number): string {
  return `₹${(coins / COINS_PER_RUPEE).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
