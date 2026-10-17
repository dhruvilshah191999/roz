import { dayParam, error, gameParam, json, readJson } from "@/lib/api";
import { submitGame } from "@/lib/play";
import { requireAccount } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ game: string }> }) {
  const game = await gameParam(ctx.params);
  if (!game) return error("Unknown game", 404);
  const account = await requireAccount();
  const body = await readJson(req);
  const res = await submitGame(account, dayParam(body), game, body.solution ?? null);
  if (!res.ok) return error(res.error, res.status);
  return json(res);
}
