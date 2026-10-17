import Link from "next/link";
import { Header } from "@/components/Header";
import { PageTitle } from "@/components/PageTitle";
import { summarise } from "@/lib/accounts";
import { GAMES } from "@/lib/games";
import { allTimeBoard, weeklyBoard, type RankRow } from "@/lib/leaderboard";
import { COINS, dayInIST, formatCoins, formatDayShort, formatElapsed, isoWeek } from "@/lib/scoring";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

const PALETTE = ["#FFE98A", "#E3EEF9", "#E6F4EC", "#FFE1D6", "#EDE7F6", "#F1F2EE", "#FFF4D6"];

export default async function RanksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const all = tab === "all";
  const account = await getAccount();
  const me = summarise(account);
  const board = all ? await allTimeBoard(account?.id ?? null) : await weeklyBoard(account?.id ?? null);
  const today = dayInIST();

  const value = (r: RankRow) => (all ? `${formatCoins(r.score)} coins` : formatElapsed(r.timeMs));
  const sub = (r: RankRow) => (all ? `best streak ${r.daysPlayed}` : `${r.score} of ${7} days`);

  return (
    <main className="col">
      <Header active="ranks" balance={me.balance} streak={me.streak} />

      <PageTitle
        eyebrow={all ? "Since the start" : `${isoWeek(today).replace(/^\d+-W/, "Week ")} · ${board.weekStart.slice(8)} to ${formatDayShort(board.weekEnd)}`}
        title="Ranks"
        right={
          <div className="flex border-[1.5px] border-line rounded-full p-[3px] shrink-0">
            <Link href="/ranks" className={`h-[30px] px-3 rounded-full text-[13px] flex items-center ${!all ? "bg-ink text-white font-bold" : "text-muted font-semibold"}`}>
              This week
            </Link>
            <Link href="/ranks?tab=all" className={`h-[30px] px-3 rounded-full text-[13px] flex items-center ${all ? "bg-ink text-white font-bold" : "text-muted font-semibold"}`}>
              All time
            </Link>
          </div>
        }
      />

      <div className="mx-5 mt-3.5 text-[13px] text-muted">
        {all
          ? "Lifetime coins earned. Spending coins on rewards does not lower your rank."
          : `Days with all ${GAMES.length} puzzles done this week, then total solve time. Leaving a page keeps the clock running.`}
      </div>

      {board.me ? (
        <div className="mx-5 mt-4 px-4 py-3.5 rounded-[14px] bg-dark text-white flex items-center gap-3.5">
          <div className="display text-[22px] min-w-10">#{board.me.rank}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] truncate">You · {board.me.name}</div>
            <div className="text-xs text-[#C9CDD3]">{sub(board.me)}</div>
          </div>
          <div className="tnum font-bold">{value(board.me)}</div>
        </div>
      ) : (
        <div className="mx-5 mt-4 px-4 py-3.5 rounded-[14px] bg-ground text-[13px] text-muted">
          {all ? "Earn your first coins to appear here." : `Finish all ${GAMES.length} puzzles on one day this week to appear here.`}
        </div>
      )}

      <div className="mx-5 mt-3.5 card overflow-hidden">
        {board.rows.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">No one has finished a set this week. Be first.</div>}
        {board.rows.map((r, i) => (
          <div key={r.accountId} className={`flex items-center gap-3.5 px-4 py-3 border-b border-line text-[15px] ${r.isMe ? "bg-coin/40" : ""}`}>
            <div className={`min-w-8 font-bold tnum ${r.rank <= 3 ? "text-green" : "text-muted"}`}>{r.rank}</div>
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px]" style={{ background: PALETTE[i % PALETTE.length] }}>
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{r.name}</div>
              <div className="text-xs text-muted">{sub(r)}</div>
            </div>
            <div className="tnum font-bold">{value(r)}</div>
          </div>
        ))}
      </div>

      {!all && <div className="mx-5 mt-3.5 text-center text-[13px] text-muted">Top 3 on Sunday night get {COINS.weeklyTop3} bonus coins.</div>}
    </main>
  );
}
