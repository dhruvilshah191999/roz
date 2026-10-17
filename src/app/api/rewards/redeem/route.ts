import { error, json, readJson } from "@/lib/api";
import { isBrand, redeem } from "@/lib/rewards";
import { requireAccount } from "@/lib/session";

export async function POST(req: Request) {
  const account = await requireAccount();
  const body = await readJson(req);
  const tierCoins = Number(body.tierCoins);
  const brand = body.brand;
  if (!Number.isInteger(tierCoins) || !isBrand(brand)) return error("Bad request", 400);
  const res = await redeem(account.id, tierCoins, brand);
  if (!res.ok) return error(res.error, res.status);
  return json({ ok: true, code: res.redemption.code, balance: res.balance });
}
