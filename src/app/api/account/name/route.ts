import { error, json, readJson } from "@/lib/api";
import { cleanName, markNamePrompted, setDisplayName } from "@/lib/accounts";
import { requireAccount } from "@/lib/session";

export async function POST(req: Request) {
  const account = await requireAccount();
  const body = await readJson(req);
  if (body.skip === true) {
    await markNamePrompted(account.id);
    return json({ ok: true, displayName: account.displayName });
  }
  const name = cleanName(body.name);
  if (!name) return error("Name must be 2 to 20 letters or numbers", 400);
  await setDisplayName(account.id, name);
  return json({ ok: true, displayName: name });
}
