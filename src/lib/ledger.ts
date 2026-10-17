import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, type Tx } from "./db/client";
import { accounts, ledger, type LedgerRow } from "./db/schema";

export type LedgerReason = "solve" | "under_par" | "full_set" | "streak" | "hint" | "redeem" | "weekly_top3";

export interface Ref {
  day?: string;
  game?: string;
}

/** Add coins. Updates balance and lifetime total in the same statement. */
export async function credit(tx: Tx, accountId: string, amount: number, reason: LedgerReason, ref: Ref = {}): Promise<void> {
  if (amount <= 0) return;
  await tx.insert(ledger).values({ accountId, amount, reason, refDay: ref.day ?? null, refGame: ref.game ?? null });
  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + ${amount}`, lifetimeEarned: sql`${accounts.lifetimeEarned} + ${amount}` })
    .where(eq(accounts.id, accountId));
}

/** Remove coins. Returns false (and writes nothing) if the balance would go negative. */
export async function debit(tx: Tx, accountId: string, amount: number, reason: LedgerReason, ref: Ref = {}): Promise<boolean> {
  if (amount <= 0) return true;
  const updated = await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - ${amount}` })
    .where(and(eq(accounts.id, accountId), gte(accounts.balance, amount)))
    .returning({ id: accounts.id });
  if (updated.length === 0) return false;
  await tx.insert(ledger).values({ accountId, amount: -amount, reason, refDay: ref.day ?? null, refGame: ref.game ?? null });
  return true;
}

export async function recentLedger(accountId: string, limit = 30): Promise<LedgerRow[]> {
  return db.select().from(ledger).where(eq(ledger.accountId, accountId)).orderBy(desc(ledger.createdAt), desc(ledger.id)).limit(limit);
}

export async function ledgerForDay(accountId: string, day: string): Promise<LedgerRow[]> {
  return db
    .select()
    .from(ledger)
    .where(and(eq(ledger.accountId, accountId), eq(ledger.refDay, day)))
    .orderBy(ledger.id);
}

export function describeReason(row: Pick<LedgerRow, "reason" | "refGame">, gameName?: string): string {
  switch (row.reason) {
    case "solve":
      return `Solved ${gameName ?? row.refGame ?? "puzzle"}`;
    case "under_par":
      return `Under par, ${gameName ?? row.refGame ?? "puzzle"}`;
    case "full_set":
      return "All puzzles done";
    case "streak":
      return "Streak bonus";
    case "hint":
      return `Hint, ${gameName ?? row.refGame ?? "puzzle"}`;
    case "redeem":
      return "Coupon";
    case "weekly_top3":
      return "Weekly top 3";
    default:
      return row.reason;
  }
}
