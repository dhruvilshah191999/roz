import { dayParam, error, gameParam, json, readJson } from "@/lib/api";
import { requestHint } from "@/lib/play";
import { requireAccount } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ game: string }> }) {
  const game = await gameParam(ctx.params);
  if (!game) return error("Unknown game", 404);
  const account = await requireAccount();
  const body = await readJson(req);
  const res = await requestHint(account, dayParam(body), game, body.state ?? null);
  if (!res.ok) return error(res.error, res.status);
  return json(res);
}
