import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { accounts, type Account } from "./db/schema";
import { createAccount } from "./accounts";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "roz_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export { hashToken, newToken };

/** The account behind the cookie, or null. Safe to call during page render. */
export async function getAccount(): Promise<Account | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length !== 64) return null;
  const rows = await db.select().from(accounts).where(eq(accounts.tokenHash, hashToken(token))).limit(1);
  return rows[0] ?? null;
}

/** Route handlers and server actions only: cookies cannot be set during render. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/** Route handlers only. Returns the cookie's account, creating one on first contact. */
export async function requireAccount(): Promise<Account> {
  const existing = await getAccount();
  if (existing) return existing;
  const { account, token } = await createAccount();
  await setSessionCookie(token);
  return account;
}
