import { notFound } from "next/navigation";
import { PlaySession } from "@/components/play/PlaySession";
import type { ShareLine } from "@/lib/share";
import { summarise } from "@/lib/accounts";
import { getDailyView } from "@/lib/daily";
import { getGame, isGameId } from "@/lib/games";
import { Rng } from "@/lib/games/rng";
import { ledgerForDay } from "@/lib/ledger";
import type { CoinLine } from "@/lib/play";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ practice?: string; seed?: string }>;
}) {
  const { game: id } = await params;
  const sp = await searchParams;
  if (!isGameId(id)) notFound();
  const def = getGame(id)!;
  const practice = sp.practice === "1";

  const account = await getAccount();
  const me = summarise(account);
  const daily = await getDailyView(account?.id ?? null);
  const game = daily.games.find((g) => g.id === id)!;

  let practiceFull: unknown = null;
  let view = game;
  if (practice) {
    practiceFull = def.generate(new Rng(`practice|${id}|${sp.seed ?? Date.now()}|${Math.random()}`));
    view = { ...game, puzzle: def.toPublic(practiceFull), par: def.parOf(practiceFull), result: null };
  }

  const next = daily.games.find((g) => g.id !== id && !g.result?.solvedAt) ?? null;
  const lines = account && game.result?.solvedAt ? await ledgerForDay(account.id, daily.day) : [];
  const setDone = daily.solvedCount >= daily.total;
  const coinLines: CoinLine[] = lines
    .filter((l) => l.amount > 0 && (l.refGame === id || (setDone && (l.reason === "full_set" || l.reason === "streak"))))
    .map((l) => ({ reason: l.reason as CoinLine["reason"], amount: l.amount }));

  const shareLines: ShareLine[] = daily.games.map((g) => ({
    id: g.id,
    name: g.name,
    parType: g.parType,
    unit: g.unit,
    elapsedMs: g.result?.solvedAt ? g.result.elapsedMs : null,
    moves: g.result?.solvedAt ? g.result.moves : null,
  }));

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/^https?:\/\//, "") || "roz";

  return (
    <main className="col">
      <PlaySession
        day={daily.day}
        game={view}
        practice={practice}
        practiceFull={practiceFull}
        serverNow={new Date().toISOString()}
        nextGameId={next?.id ?? null}
        nextGameName={next?.name ?? null}
        solvedCount={daily.solvedCount}
        totalGames={daily.total}
        coinLines={coinLines}
        account={me}
        siteUrl={siteUrl}
        shareLines={shareLines}
      />
    </main>
  );
}
