import Link from "next/link";
import type { DailyGameView } from "@/lib/daily";
import { countLabel } from "@/lib/games";
import { formatElapsed } from "@/lib/scoring";
import { GameIcon } from "./GameIcon";
import { CheckIcon } from "./Icons";

export function GameCard({ game, coinsEarned, elapsedNow }: { game: DailyGameView; coinsEarned: number; elapsedNow: number | null }) {
  const r = game.result;
  const done = !!r?.solvedAt;
  const inProgress = !!r && !done;

  return (
    <Link
      href={`/play/${game.id}`}
      className={`card flex items-center gap-3.5 p-3.5 ${inProgress ? "border-ink" : ""}`}
      aria-label={`${game.name}: ${done ? "done" : inProgress ? "continue" : "play"}`}
    >
      <GameIcon id={game.id} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[17px]">{game.name}</div>
        <div className="text-[13px] text-muted mt-0.5">{game.tagline}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {done && (
          <>
            <div className="flex items-center gap-1 text-[13px] font-bold text-green">
              <CheckIcon />
              <span className="tnum">{game.parType === "time" ? formatElapsed(r!.elapsedMs ?? 0) : countLabel(r!.moves ?? 0, game.unit)}</span>
            </div>
            <div className="text-xs text-muted">+{coinsEarned} coins</div>
          </>
        )}
        {inProgress && (
          <>
            <div className="h-8 px-3.5 rounded-full bg-ink text-white text-[13px] font-bold flex items-center">Continue</div>
            <div className="text-xs text-muted tnum">{elapsedNow !== null ? `${formatElapsed(elapsedNow)} so far` : "in progress"}</div>
          </>
        )}
        {!r && (
          <>
            <div className="h-8 px-3.5 rounded-full border-[1.5px] border-ink text-ink text-[13px] font-bold flex items-center">Play</div>
            <div className="text-xs text-muted">{game.estimate}</div>
          </>
        )}
      </div>
    </Link>
  );
}
