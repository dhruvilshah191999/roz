import { NextResponse } from "next/server";
import { isGameId, type GameId } from "./games";
import { dayInIST } from "./scoring";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function error(message: string, status: number): NextResponse {
  return json({ error: message }, status);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function gameParam(params: Promise<{ game: string }>): Promise<GameId | null> {
  const { game } = await params;
  return isGameId(game) ? game : null;
}

/** Day from the body, defaulting to today. Shape-checked only; play.ts decides if it is playable. */
export function dayParam(body: Record<string, unknown>): string {
  const d = body.day;
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : dayInIST();
}
