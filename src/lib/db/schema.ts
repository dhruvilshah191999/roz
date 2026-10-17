import { bigserial, boolean, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** sha256 of the session cookie token */
  tokenHash: text("token_hash").notNull().unique(),
  /** WORD-1234, shown to the user for restore */
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  /** scrypt hash; null = coins not protected */
  pinHash: text("pin_hash"),
  pinFailed: integer("pin_failed").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true }),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastFullDay: date("last_full_day"),
  /** ISO week (2026-W42) in which the streak shield was used */
  shieldWeek: text("shield_week"),
  namePrompted: boolean("name_prompted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyPuzzles = pgTable(
  "daily_puzzles",
  {
    day: date("day").notNull(),
    game: text("game").notNull(),
    /** Full puzzle including the solution. Never sent to the client as-is. */
    puzzle: jsonb("puzzle").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.game] })],
);

export const dailyResults = pgTable(
  "daily_results",
  {
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    game: text("game").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    elapsedMs: integer("elapsed_ms"),
    moves: integer("moves"),
    hintsUsed: integer("hints_used").notNull().default(0),
    underPar: boolean("under_par").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.day, t.game] }),
    index("daily_results_day_game_idx").on(t.day, t.game),
    index("daily_results_account_day_idx").on(t.accountId, t.day),
  ],
);

export const ledger = pgTable(
  "ledger",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    /** signed */
    amount: integer("amount").notNull(),
    /** solve | under_par | full_set | streak | hint | redeem | weekly_top3 */
    reason: text("reason").notNull(),
    refDay: date("ref_day"),
    refGame: text("ref_game"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ledger_account_created_idx").on(t.accountId, t.createdAt)],
);

export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  tierCoins: integer("tier_coins").notNull(),
  rupees: integer("rupees").notNull(),
  brand: text("brand").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Account = typeof accounts.$inferSelect;
export type DailyResult = typeof dailyResults.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
