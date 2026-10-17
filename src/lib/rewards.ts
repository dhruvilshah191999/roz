import { randomInt } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db/client";
import { redemptions, type Redemption } from "./db/schema";
import { debit } from "./ledger";

export interface Tier {
  coins: number;
  rupees: number;
}

export const TIERS: Tier[] = [
  { coins: 500, rupees: 5 },
  { coins: 1000, rupees: 10 },
  { coins: 2000, rupees: 20 },
];

export const BRANDS = [
  { id: "amazon", label: "Amazon" },
  { id: "flipkart", label: "Flipkart" },
  { id: "zomato", label: "Zomato" },
] as const;

export type BrandId = (typeof BRANDS)[number]["id"];

export function isBrand(x: unknown): x is BrandId {
  return BRANDS.some((b) => b.id === x);
}

export function brandLabel(id: string): string {
  return BRANDS.find((b) => b.id === id)?.label ?? id;
}

// no 0/O/1/I so codes read cleanly on a phone
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function demoCode(): string {
  const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `DEMO-${block()}-${block()}`;
}

export type RedeemResult = { ok: true; redemption: Redemption; balance: number } | { ok: false; error: string; status: number };

export async function redeem(accountId: string, tierCoins: number, brand: BrandId): Promise<RedeemResult> {
  const tier = TIERS.find((t) => t.coins === tierCoins);
  if (!tier) return { ok: false, error: "Unknown reward", status: 400 };
  return db.transaction(async (tx) => {
    const paid = await debit(tx, accountId, tier.coins, "redeem");
    if (!paid) return { ok: false, error: "Not enough coins", status: 402 };
    const [row] = await tx
      .insert(redemptions)
      .values({ accountId, tierCoins: tier.coins, rupees: tier.rupees, brand, code: demoCode() })
      .returning();
    const rows = (await tx.execute(sql`select balance from accounts where id = ${accountId}::uuid`)) as unknown as Array<{ balance: number }>;
    const balance = rows[0]?.balance ?? 0;
    return { ok: true, redemption: row, balance: Number(balance) };
  });
}

export async function listRedemptions(accountId: string): Promise<Redemption[]> {
  return db.select().from(redemptions).where(eq(redemptions.accountId, accountId)).orderBy(desc(redemptions.createdAt));
}
