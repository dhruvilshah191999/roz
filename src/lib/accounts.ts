import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db/client";
import { accounts, dailyResults, ledger, type Account } from "./db/schema";
import { hashToken, newToken } from "./tokens";
import { levelFor, streakAlive, dayInIST, isoWeek } from "./scoring";
import { planMerge, puzzleKey } from "./merge";
import { getGame } from "./games";

/** Simple nouns most people know, for account codes like MANGO-7342. */
const WORDS = [
  "mango", "apple", "banana", "guava", "lemon", "grape", "papaya", "cherry", "peach", "melon",
  "tiger", "lion", "zebra", "camel", "horse", "eagle", "parrot", "rabbit", "panda", "koala",
  "river", "ocean", "cloud", "storm", "sunny", "rainy", "forest", "desert", "island", "valley",
  "ruby", "pearl", "amber", "coral", "jade", "topaz", "opal", "onyx", "ivory", "silver",
  "cobra", "whale", "shark", "otter", "bison", "moose", "llama", "yak", "goat", "sheep",
  "rose", "lotus", "tulip", "daisy", "lily", "jasmine", "orchid", "maple", "cedar", "bamboo",
  "pizza", "bread", "honey", "sugar", "pepper", "butter", "cocoa", "chai", "coffee", "samosa",
  "rocket", "comet", "planet", "meteor", "galaxy", "orbit", "lunar", "solar", "nova", "star",
  "cricket", "hockey", "tennis", "chess", "carrom", "kabaddi", "ludo", "kite", "ball", "bat",
  "drum", "flute", "guitar", "piano", "violin", "sitar", "tabla", "bell", "harp", "horn",
  "train", "truck", "cycle", "boat", "plane", "metro", "scooter", "tram", "ship", "jeep",
  "pillow", "candle", "mirror", "basket", "bucket", "ladder", "window", "garden", "bridge", "tower",
];

export function makeCode(): string {
  const word = WORDS[randomInt(WORDS.length)].toUpperCase();
  const digits = String(randomInt(1000, 10000));
  return `${word}-${digits}`;
}

export async function createAccount(): Promise<{ account: Account; token: string }> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = makeCode();
    const token = newToken();
    try {
      const rows = await db
        .insert(accounts)
        .values({ tokenHash: hashToken(token), code, displayName: `Player ${code.split("-")[1]}` })
        .returning();
      return { account: rows[0], token };
    } catch (err) {
      const msg = (err as { code?: string }).code;
      if (msg !== "23505") throw err; // unique violation → retry with a new code
    }
  }
  throw new Error("could not allocate an account code");
}

// ---------- PIN ----------

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export async function setPin(account: Account, pin: string, oldPin?: string): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (account.pinHash) {
    if (!oldPin || !verifyPin(oldPin, account.pinHash)) return { ok: false, error: "Current PIN is wrong", status: 401 };
  }
  await db.update(accounts).set({ pinHash: hashPin(pin), pinFailed: 0, pinLockedUntil: null }).where(eq(accounts.id, account.id));
  return { ok: true };
}

export async function setDisplayName(accountId: string, name: string): Promise<void> {
  await db.update(accounts).set({ displayName: name, namePrompted: true }).where(eq(accounts.id, accountId));
}

export async function markNamePrompted(accountId: string): Promise<void> {
  await db.update(accounts).set({ namePrompted: true }).where(eq(accounts.id, accountId));
}

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return null;
  return name;
}

// ---------- restore ----------

const MAX_PIN_FAILS = 5;
const LOCK_MS = 60 * 60 * 1000;

export type RestoreResult =
  | { ok: true; token: string; account: Account; mergedCoins: number }
  | { ok: false; error: string; status: number };

/**
 * Point this browser at the account behind `code` + `pin`.
 * The current (throwaway) account, if any, is merged in: each puzzle keeps the
 * better of the two attempts, coins follow the kept attempt and are never paid
 * twice (see merge.ts), then the throwaway account is deleted.
 */
export async function restoreAccount(code: string, pin: string, current: Account | null): Promise<RestoreResult> {
  const normalised = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]+-\d{4}$/.test(normalised)) return { ok: false, error: "That code does not look right", status: 400 };
  if (!isValidPin(pin)) return { ok: false, error: "PIN must be 4 digits", status: 400 };

  const found = await db.select().from(accounts).where(eq(accounts.code, normalised)).limit(1);
  const target = found[0];
  if (!target) return { ok: false, error: "No account with that code", status: 404 };
  if (!target.pinHash) return { ok: false, error: "That account has no PIN, so it cannot be restored", status: 403 };
  if (target.pinLockedUntil && target.pinLockedUntil.getTime() > Date.now()) {
    return { ok: false, error: "Too many wrong PINs. Try again in an hour", status: 423 };
  }
  if (!verifyPin(pin, target.pinHash)) {
    const fails = target.pinFailed + 1;
    await db
      .update(accounts)
      .set({ pinFailed: fails, pinLockedUntil: fails >= MAX_PIN_FAILS ? new Date(Date.now() + LOCK_MS) : null })
      .where(eq(accounts.id, target.id));
    return { ok: false, error: fails >= MAX_PIN_FAILS ? "Too many wrong PINs. Locked for an hour" : "Wrong PIN", status: 401 };
  }

  const token = newToken();
  let mergedCoins = 0;

  const account = await db.transaction(async (tx) => {
    const [a] = await tx.select().from(accounts).where(eq(accounts.id, target.id)).for("update");
    if (current && current.id !== a.id) {
      const [b] = await tx.select().from(accounts).where(eq(accounts.id, current.id)).for("update");
      if (b) {
        // Each puzzle keeps the better attempt; coins follow it (see merge.ts).
        const resultCols = {
          day: dailyResults.day,
          game: dailyResults.game,
          solvedAt: dailyResults.solvedAt,
          elapsedMs: dailyResults.elapsedMs,
          moves: dailyResults.moves,
        };
        const ledgerCols = { id: ledger.id, amount: ledger.amount, reason: ledger.reason, refDay: ledger.refDay, refGame: ledger.refGame };
        const toMerge = (r: { day: string; game: string; solvedAt: Date | null; elapsedMs: number | null; moves: number | null }) => ({
          day: r.day,
          game: r.game,
          solved: r.solvedAt !== null,
          elapsedMs: r.elapsedMs,
          moves: r.moves,
        });
        const [aResults, bResults, aRows, bRows] = await Promise.all([
          tx.select(resultCols).from(dailyResults).where(eq(dailyResults.accountId, a.id)),
          tx.select(resultCols).from(dailyResults).where(eq(dailyResults.accountId, b.id)),
          tx.select(ledgerCols).from(ledger).where(eq(ledger.accountId, a.id)),
          tx.select(ledgerCols).from(ledger).where(eq(ledger.accountId, b.id)),
        ]);
        const plan = planMerge({
          aRows,
          bRows,
          aResults: aResults.map(toMerge),
          bResults: bResults.map(toMerge),
          parTypeOf: (game) => getGame(game)?.parType ?? "time",
        });
        mergedCoins = plan.balanceDelta;
        if (plan.dropIds.length > 0) await tx.delete(ledger).where(inArray(ledger.id, plan.dropIds));
        await tx.update(ledger).set({ accountId: a.id }).where(eq(ledger.accountId, b.id));
        // results: B's attempt replaces A's where it is better, or fills a gap
        for (const r of bResults) {
          if (!plan.takeFromB.has(puzzleKey(r.day, r.game))) continue;
          await tx
            .delete(dailyResults)
            .where(and(eq(dailyResults.accountId, a.id), eq(dailyResults.day, r.day), eq(dailyResults.game, r.game)));
          await tx
            .update(dailyResults)
            .set({ accountId: a.id })
            .where(and(eq(dailyResults.accountId, b.id), eq(dailyResults.day, r.day), eq(dailyResults.game, r.game)));
        }
        await tx.delete(dailyResults).where(eq(dailyResults.accountId, b.id));
        // A balance can go below zero if B spent coins it no longer has.
        // debit() then blocks hints and redeems until it is earned back.
        await tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${plan.balanceDelta}`,
            lifetimeEarned: sql`${accounts.lifetimeEarned} + ${plan.lifetimeDelta}`,
          })
          .where(eq(accounts.id, a.id));
        await tx.delete(accounts).where(eq(accounts.id, b.id));
      }
    }
    const [updated] = await tx
      .update(accounts)
      .set({ tokenHash: hashToken(token), pinFailed: 0, pinLockedUntil: null })
      .where(eq(accounts.id, a.id))
      .returning();
    return updated;
  });

  return { ok: true, token, account, mergedCoins };
}

// ---------- summary for pages ----------

export interface AccountSummary {
  exists: boolean;
  code: string | null;
  displayName: string;
  isProtected: boolean;
  balance: number;
  lifetimeEarned: number;
  streak: number;
  bestStreak: number;
  streakAlive: boolean;
  shieldAvailable: boolean;
  level: ReturnType<typeof levelFor>;
  namePrompted: boolean;
}

export function summarise(account: Account | null, today = dayInIST()): AccountSummary {
  if (!account) {
    return {
      exists: false,
      code: null,
      displayName: "Player",
      isProtected: false,
      balance: 0,
      lifetimeEarned: 0,
      streak: 0,
      bestStreak: 0,
      streakAlive: false,
      shieldAvailable: true,
      level: levelFor(0),
      namePrompted: false,
    };
  }
  const state = { streak: account.streak, bestStreak: account.bestStreak, lastFullDay: account.lastFullDay, shieldWeek: account.shieldWeek };
  const alive = streakAlive(state, today);
  return {
    exists: true,
    code: account.code,
    displayName: account.displayName,
    isProtected: !!account.pinHash,
    balance: account.balance,
    lifetimeEarned: account.lifetimeEarned,
    streak: alive ? account.streak : 0,
    bestStreak: account.bestStreak,
    streakAlive: alive,
    shieldAvailable: account.shieldWeek !== isoWeek(today),
    level: levelFor(account.lifetimeEarned),
    namePrompted: account.namePrompted,
  };
}

export async function countSolved(accountId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dailyResults)
    .where(and(eq(dailyResults.accountId, accountId), sql`${dailyResults.solvedAt} is not null`));
  return rows[0]?.n ?? 0;
}
