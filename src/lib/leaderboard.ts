import { sql } from "drizzle-orm";
import { db } from "./db/client";
import { GAMES } from "./games";
import { dayInIST, weekRange } from "./scoring";

export interface RankRow {
  accountId: string;
  rank: number;
  name: string;
  /** full sets this week (weekly) or lifetime coins (all time) */
  score: number;
  /** total ms over full-set days (weekly) */
  timeMs: number;
  daysPlayed: number;
  isMe: boolean;
}

export interface Board {
  rows: RankRow[];
  me: RankRow | null;
  weekStart: string;
  weekEnd: string;
}

export async function weeklyBoard(meId: string | null, today = dayInIST()): Promise<Board> {
  const { start, end } = weekRange(today);
  const n = GAMES.length;
  const res = await db.execute(sql`
    with days as (
      select account_id, day, count(*)::int as solved, coalesce(sum(elapsed_ms), 0)::bigint as time_ms
      from daily_results
      where solved_at is not null and day between ${start} and ${end}
      group by account_id, day
    ),
    totals as (
      select account_id,
             count(*) filter (where solved >= ${n})::int as sets,
             coalesce(sum(time_ms) filter (where solved >= ${n}), 0)::bigint as time_ms,
             count(*)::int as days_played
      from days
      group by account_id
    ),
    ranked as (
      select t.account_id, t.sets, t.time_ms, t.days_played, a.display_name,
             rank() over (order by t.sets desc, t.time_ms asc)::int as rank
      from totals t join accounts a on a.id = t.account_id
      where t.sets > 0
    )
    select * from ranked
    where rank <= 50 or account_id = ${meId ?? "00000000-0000-0000-0000-000000000000"}::uuid
    order by rank, display_name
  `);
  const all = (res as unknown as Array<Record<string, unknown>>).map(toRow(meId, "sets"));
  return { rows: all.filter((r) => r.rank <= 50), me: all.find((r) => r.isMe) ?? null, weekStart: start, weekEnd: end };
}

export async function allTimeBoard(meId: string | null): Promise<Board> {
  const res = await db.execute(sql`
    with ranked as (
      select id as account_id, display_name, lifetime_earned, best_streak,
             rank() over (order by lifetime_earned desc, created_at asc)::int as rank
      from accounts
      where lifetime_earned > 0
    )
    select * from ranked
    where rank <= 50 or account_id = ${meId ?? "00000000-0000-0000-0000-000000000000"}::uuid
    order by rank
  `);
  const all = (res as unknown as Array<Record<string, unknown>>).map(toRow(meId, "lifetime_earned"));
  return { rows: all.filter((r) => r.rank <= 50), me: all.find((r) => r.isMe) ?? null, weekStart: "", weekEnd: "" };
}

function toRow(meId: string | null, scoreKey: string) {
  return (r: Record<string, unknown>): RankRow => ({
    accountId: String(r.account_id),
    rank: Number(r.rank),
    name: String(r.display_name),
    score: Number(r[scoreKey] ?? 0),
    timeMs: Number(r.time_ms ?? 0),
    daysPlayed: Number(r.days_played ?? r.best_streak ?? 0),
    isMe: meId !== null && String(r.account_id) === meId,
  });
}
