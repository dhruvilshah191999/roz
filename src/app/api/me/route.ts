import { json } from "@/lib/api";
import { countSolved, summarise } from "@/lib/accounts";
import { requireAccount } from "@/lib/session";

/** Creates the account on first contact and sets the session cookie. */
export async function GET() {
  const account = await requireAccount();
  const solved = await countSolved(account.id);
  return json({ ...summarise(account), solved });
}
