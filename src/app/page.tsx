import Link from "next/link";
import { GameCard } from "@/components/GameCard";
import { Header } from "@/components/Header";
import { PageTitle } from "@/components/PageTitle";
import { PinNudge } from "@/components/PinNudge";
import { PurgeOldDays } from "@/components/PurgeOldDays";
import { summarise } from "@/lib/accounts";
import { getDailyView } from "@/lib/daily";
import { ledgerForDay } from "@/lib/ledger";
import { COINS, formatDayLong } from "@/lib/scoring";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const account = await getAccount();
  const me = summarise(account);
  const daily = await getDailyView(account?.id ?? null);
  const lines = account ? await ledgerForDay(account.id, daily.day) : [];
  const now = Date.now();

  const coinsFor = (gameId: string) => lines.filter((l) => l.refGame === gameId && l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const allDone = daily.solvedCount >= daily.total;

  return (
    <main className="col">
      <PurgeOldDays day={daily.day} />
      <Header active="play" balance={me.balance} streak={me.streak} />

      <PageTitle eyebrow={formatDayLong(daily.day)} title="Today's puzzles" />

      <div className="mx-5 mt-4 px-4 py-3.5 rounded-[14px] bg-dark text-white flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold">
            {daily.solvedCount} of {daily.total} done
          </span>
          <span className="text-coin font-bold">{allDone ? "Set bonus earned" : `Finish all ${daily.total} · +${COINS.fullSet} coins`}</span>
        </div>
        <div className="flex gap-1.5">
          {daily.games.map((g) => (
            <div key={g.id} className={`flex-1 h-2 rounded-full ${g.result?.solvedAt ? "bg-green-bright" : "bg-dark-2"}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {daily.games.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            coinsEarned={coinsFor(g.id)}
            elapsedNow={g.result && !g.result.solvedAt ? now - new Date(g.result.startedAt).getTime() : null}
          />
        ))}
      </div>

      {me.exists && !me.isProtected && <PinNudge className="mx-5 mt-4" />}

      <div className="mx-5 mt-5 pt-4 border-t border-line flex justify-between items-center gap-3">
        <div className="text-[13px] text-muted">Want more? Practice puzzles earn no coins.</div>
        <Link href={`/play/${daily.games[0].id}?practice=1`} className="text-[13px] font-bold underline underline-offset-4 shrink-0">
          Practice
        </Link>
      </div>

      <div className="px-5 pt-6 text-xs text-faint flex gap-3.5 flex-wrap">
        <span>New puzzles at midnight</span>
        <Link href="/restore" className="underline">
          Restore account
        </Link>
        <span>Rewards are demo only</span>
      </div>
    </main>
  );
}
