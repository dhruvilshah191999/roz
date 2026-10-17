"use client";

import { useRouter } from "next/navigation";
import type { AccountSummary } from "@/lib/accounts";
import { stateKey } from "@/lib/clientState";
import type { DailyGameView } from "@/lib/daily";
import { countLabel, type GameId } from "@/lib/games";
import type { CoinLine } from "@/lib/play";
import { buildShareText, type ShareLine } from "@/lib/share";
import { PlayBar } from "../PlayBar";
import { ResultView } from "../result/ResultView";
import { Clock } from "./Clock";
import { PLAY_COMPONENTS } from "./registry";
import { useGameSession } from "./useGameSession";

export interface PlaySessionProps {
  day: string;
  game: DailyGameView;
  practice: boolean;
  practiceFull: unknown | null;
  serverNow: string;
  nextGameId: GameId | null;
  nextGameName: string | null;
  solvedCount: number;
  totalGames: number;
  coinLines: CoinLine[];
  account: AccountSummary;
  siteUrl: string;
  shareLines: ShareLine[];
}

/** Picks the game component, owns the session, and swaps to the result when solved. */
export function PlaySession(p: PlaySessionProps) {
  const router = useRouter();
  const { game } = p;
  const key = stateKey(p.practice ? "practice" : p.day, game.id);
  const session = useGameSession({
    day: p.day,
    gameId: game.id,
    practice: p.practice,
    serverNow: p.serverNow,
    stateKey: key,
    initialResult: game.result,
    initialBalance: p.account.balance,
    initialCoins: p.coinLines,
    solvedCount: p.solvedCount,
    totalGames: p.totalGames,
    streak: p.account.streak,
  });
  const title = p.practice ? `${game.name} · practice` : game.name;

  if (session.phase === "solved" && session.outcome) {
    const o = session.outcome;
    return (
      <>
        <PlayBar backHref="/" backLabel="Today" title={title} right={game.parType === "time" ? <Clock ms={o.elapsedMs} /> : null} />
        <ResultView
          gameName={game.name}
          nextGameId={p.nextGameId}
          nextGameName={p.nextGameName}
          practice={p.practice}
          parType={game.parType}
          unit={game.unit}
          par={game.par}
          outcome={o}
          totalGames={p.totalGames}
          showNamePrompt={o.firstSolveEver && !p.account.namePrompted}
          showPinNudge={!p.account.isProtected}
          shareText={buildShareText(p.day, p.shareLines, o.streak, p.siteUrl, { id: game.id, elapsedMs: o.elapsedMs, moves: o.moves })}
          onPlayAgain={() => router.push(`/play/${game.id}?practice=1&seed=${Date.now()}`)}
        />
      </>
    );
  }

  const Play = PLAY_COMPONENTS[game.id];
  return (
    <>
      <PlayBar
        backHref="/"
        backLabel="Today"
        title={title}
        right={game.parType === "time" ? <Clock ms={session.elapsedMs} /> : <Clock label={countLabel(session.count, game.unit)} />}
      />
      <Play game={game} session={session} practiceFull={p.practiceFull} stateKey={key} />
    </>
  );
}
