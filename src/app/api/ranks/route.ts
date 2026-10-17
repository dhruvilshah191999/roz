import { json } from "@/lib/api";
import { allTimeBoard, weeklyBoard } from "@/lib/leaderboard";
import { getAccount } from "@/lib/session";

export async function GET(req: Request) {
  const tab = new URL(req.url).searchParams.get("tab") === "all" ? "all" : "week";
  const account = await getAccount();
  const board = tab === "all" ? await allTimeBoard(account?.id ?? null) : await weeklyBoard(account?.id ?? null);
  return json({ tab, ...board });
}
