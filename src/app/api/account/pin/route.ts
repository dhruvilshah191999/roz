import { error, json, readJson } from "@/lib/api";
import { isValidPin, setPin } from "@/lib/accounts";
import { requireAccount } from "@/lib/session";

export async function POST(req: Request) {
  const account = await requireAccount();
  const body = await readJson(req);
  if (!isValidPin(body.pin)) return error("PIN must be 4 digits", 400);
  const oldPin = typeof body.oldPin === "string" ? body.oldPin : undefined;
  const res = await setPin(account, body.pin, oldPin);
  if (!res.ok) return error(res.error, res.status);
  return json({ ok: true, code: account.code });
}
