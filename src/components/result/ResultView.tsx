"use client";

import Link from "next/link";
import { useState } from "react";
import { countLabel, type GameId } from "@/lib/games";
import { formatElapsed } from "@/lib/scoring";
import { ChevronIcon } from "../Icons";
import { NamePrompt } from "../NamePrompt";
import { PinNudge } from "../PinNudge";
import { ShareButton } from "../ShareButton";
import type { Outcome } from "../play/useGameSession";
import { CoinTable } from "./CoinTable";
import { SetBanner } from "./SetBanner";
import { ShareBox } from "./ShareBox";
import { SolvedHero } from "./SolvedHero";

export interface ResultProps {
  gameName: string;
  nextGameId: GameId | null;
  nextGameName: string | null;
  practice: boolean;
  parType: "time" | "moves";
  unit: "moves" | "mistakes";
  par: number;
  outcome: Outcome;
  totalGames: number;
  showNamePrompt: boolean;
  showPinNudge: boolean;
  shareText: string;
  onPlayAgain: () => void;
}

function parLine(p: ResultProps): string {
  if (p.practice) return "Practice earns no coins.";
  const par = p.parType === "time" ? formatElapsed(p.par * 1000) : countLabel(p.par, p.unit);
  if (p.outcome.underPar) return `Par was ${par}. You beat it.`;
  if (p.outcome.hintsUsed > 0) return `Par was ${par}. Hints were used.`;
  return `Par was ${par}.`;
}

export function ResultView(p: ResultProps) {
  const [namePromptOpen, setNamePromptOpen] = useState(p.showNamePrompt);
  const [savedName, setSavedName] = useState<string | null>(null);
  const o = p.outcome;

  return (
    <div className="px-5">
      <SolvedHero
        title={p.practice ? "Practice solved" : "Solved"}
        big={p.parType === "time" ? formatElapsed(o.elapsedMs) : countLabel(o.moves ?? 0, p.unit)}
        line={parLine(p)}
      />

      {!p.practice && <CoinTable coins={o.coins} gameName={p.gameName} streak={o.streak} />}
      {!p.practice && <SetBanner setDone={o.setDone} remaining={p.totalGames - o.solvedCount} streak={o.streak} usedShield={o.usedShield} />}

      {namePromptOpen && (
        <div className="mt-4">
          <NamePrompt
            onDone={(name) => {
              setSavedName(name);
              setNamePromptOpen(false);
            }}
          />
        </div>
      )}
      {savedName && <div className="mt-3 text-[13px] text-muted">Saved. You are {savedName} on Ranks.</div>}

      <div className="pt-5 flex flex-col gap-2.5">
        {p.practice ? (
          <>
            <button type="button" className="btn btn-primary" onClick={p.onPlayAgain}>
              Another practice puzzle
            </button>
            <Link href="/" className="btn btn-tertiary">
              Back to today
            </Link>
          </>
        ) : (
          <>
            {p.nextGameId ? (
              <Link href={`/play/${p.nextGameId}`} className="btn btn-primary">
                <span>Next: {p.nextGameName}</span>
                <ChevronIcon stroke="#FFFFFF" size={18} />
              </Link>
            ) : (
              <Link href="/" className="btn btn-primary">
                Back to today
              </Link>
            )}
            <ShareButton text={p.shareText} />
          </>
        )}
      </div>

      {!p.practice && p.showPinNudge && <PinNudge className="mt-4" />}
      {!p.practice && <ShareBox text={p.shareText} />}
    </div>
  );
}
