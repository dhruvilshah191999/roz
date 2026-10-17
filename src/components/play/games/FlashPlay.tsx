"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countLabel } from "@/lib/games";
import { flashHint, replayFlash, roundLength, type FlashPublic, type FlashPuzzle } from "@/lib/games/flash";
import { FlashBoard, type FlashPhase } from "../../boards/FlashBoard";
import { PlayActions } from "../PlayActions";
import { PlayLayout, parNoteFor } from "../PlayLayout";
import { useHintFlash } from "../useHintFlash";
import { useSavedState } from "../useSavedState";
import type { GamePlayProps } from "../types";

const PHASE_TEXT: Partial<Record<FlashPhase, { text: string; tone: string }>> = {
  showing: { text: "Watch…", tone: "" },
  input: { text: "Your turn. Tap in the same order.", tone: "text-green" },
  wrong: { text: "Not that one. Watch again.", tone: "text-flame" },
  right: { text: "Correct.", tone: "text-green" },
};

export function FlashPlay({ game, session, practiceFull, stateKey }: GamePlayProps) {
  const puzzle = game.puzzle as FlashPublic;
  const [attempts, setAttempts] = useSavedState<number[][]>(stateKey, [], !session.practice);
  const [taps, setTaps] = useState<number[]>([]);
  const [phase, setPhase] = useState<FlashPhase>("ready");
  const [hintCell, showHint] = useHintFlash();
  const timer = useRef<number | null>(null);
  const disabled = session.phase !== "playing";

  const progress = useMemo(() => replayFlash(puzzle, attempts), [puzzle, attempts]);
  const round = Math.min(progress.round, puzzle.rounds);
  const len = roundLength(puzzle, round);
  const expected = puzzle.sequence.slice(0, len);

  useEffect(() => session.setCount(progress.mistakes), [progress.mistakes, session]);
  useEffect(() => {
    if (progress.solved) session.submit({ attempts }, progress.mistakes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.solved]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };

  const onTap = (cell: number) => {
    if (phase !== "input") return;
    if (cell === expected[taps.length]) {
      const next = [...taps, cell];
      setTaps(next);
      if (next.length === len) {
        setPhase("right");
        const last = round >= puzzle.rounds;
        later(() => {
          setAttempts((a) => [...a, next]);
          setTaps([]);
          setPhase(last ? "ready" : "showing");
        }, 650);
      }
      return;
    }
    const wrong = [...taps, cell];
    setTaps(wrong);
    setPhase("wrong");
    later(() => {
      setAttempts((a) => [...a, wrong]);
      setTaps([]);
      setPhase("showing");
    }, 900);
  };

  const onHint = async () => {
    if (phase !== "input") {
      session.setMessage("Hints work while you are tapping.");
      return;
    }
    const h = (await session.requestHint({ attempts, taps }, () => flashHint(practiceFull as FlashPuzzle, { attempts, taps }))) as Record<string, unknown> | null;
    if (h && typeof h.cell === "number") showHint(h.cell);
  };

  // watch again costs a mistake, so memory still matters
  const onWatchAgain = () => {
    if (phase === "input") setAttempts((a) => [...a, []]);
    setTaps([]);
    setPhase("showing");
  };

  const phaseText = PHASE_TEXT[phase];

  return (
    <PlayLayout
      status={
        <>
          Round <strong className="text-ink">{round}</strong> of {puzzle.rounds} · {len} tiles
          {phase === "input" && (
            <>
              {" "}
              · tapped <strong className="text-ink tnum">{taps.length}</strong>
            </>
          )}
        </>
      }
      freeLeft={session.freeLeft}
      board={<FlashBoard puzzle={puzzle} round={round} taps={taps} phase={phase} onPhase={setPhase} onTap={onTap} disabled={disabled} hintCell={hintCell} />}
      extras={
        phase === "ready" ? (
          <div className="px-5 mt-5">
            <button type="button" className="btn btn-green w-full" onClick={() => setPhase("showing")} disabled={disabled || (!session.practice && !session.started)}>
              {attempts.length ? `Watch round ${round}` : "Watch"}
            </button>
          </div>
        ) : phaseText ? (
          <div className={`text-center text-sm font-semibold mt-4 ${phaseText.tone}`}>{phaseText.text}</div>
        ) : null
      }
      parNote={parNoteFor(session.practice, countLabel(game.par, game.unit))}
      message={session.message}
      error={session.error}
      onReload={session.reload}
      checking={session.phase === "submitting"}
      actions={
        <PlayActions
          freeLeft={session.freeLeft}
          canAffordHint={session.canAffordHint}
          onHint={onHint}
          hintDisabled={disabled || phase !== "input"}
          resetLabel="Watch again"
          onReset={onWatchAgain}
          resetDisabled={disabled || phase !== "input"}
        />
      }
      howTo={game.howTo}
    />
  );
}
