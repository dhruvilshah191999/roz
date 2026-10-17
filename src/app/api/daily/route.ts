import { json } from "@/lib/api";
import { getDailyView } from "@/lib/daily";
import { getAccount } from "@/lib/session";

export async function GET() {
  const account = await getAccount();
  const view = await getDailyView(account?.id ?? null);
  return json(view);
}
