import { error, json, readJson } from "@/lib/api";
import { restoreAccount, summarise } from "@/lib/accounts";
import { getAccount, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await readJson(req);
  const code = typeof body.code === "string" ? body.code : "";
  const pin = typeof body.pin === "string" ? body.pin : "";
  const current = await getAccount();
  const res = await restoreAccount(code, pin, current);
  if (!res.ok) return error(res.error, res.status);
  await setSessionCookie(res.token);
  return json({ ok: true, mergedCoins: res.mergedCoins, account: summarise(res.account) });
}
