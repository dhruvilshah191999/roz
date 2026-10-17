"use client";

import { useEffect, useMemo } from "react";
import { flow, isPipesSolved, pipesHint, rotateMask, type PipesPublic, type PipesPuzzle } from "@/lib/games/pipes";
import { formatElapsed } from "@/lib/scoring";
import { PipesBoard } from "../../boards/PipesBoard";
import { PlayActions } from "../PlayActions";
import { PlayLayout, parNoteFor } from "../PlayLayout";
import { useHintFlash } from "../useHintFlash";
import { useSavedState } from "../useSavedState";
import type { GamePlayProps } from "../types";

export function PipesPlay({ game, session, practiceFull, stateKey }: GamePlayProps) {
  const puzzle = game.puzzle as PipesPublic;
  const cells = puzzle.size * puzzle.size;
  const zeros = useMemo(() => new Array<number>(cells).fill(0), [cells]);
  // cumulative quarter turns per tile (unbounded so the rotation animates forward)
  const [savedTurns, setTurns] = useSavedState<number[]>(`${stateKey}:turns`, zeros, !session.practice);
  const [locked, setLocked] = useSavedState<number[]>(`${stateKey}:locked`, [], !session.practice);
  const turns = savedTurns.length === cells ? savedTurns : zeros;
  const rotations = useMemo(() => turns.map((t) => t % 4), [turns]);
  const [hintCell, flashHint] = useHintFlash();
  const disabled = session.phase !== "playing";

  const houses = puzzle.kinds.filter((k) => k === "house").length;
  const wetHouses = useMemo(() => {
    const masks = puzzle.masks.map((m, i) => rotateMask(m, rotations[i]));
    const wet = flow(puzzle.size, masks, puzzle.source);
    return puzzle.kinds.filter((k, i) => k === "house" && wet.has(i)).length;
  }, [puzzle, rotations]);

  useEffect(() => {
    if (isPipesSolved(puzzle, rotations)) session.submit({ rotations });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotations]);

  const onHint = async () => {
    const h = (await session.requestHint({ rotations }, () => pipesHint(practiceFull as PipesPuzzle, { rotations }))) as Record<string, unknown> | null;
    if (!h || "done" in h || typeof h.cell !== "number" || typeof h.rotation !== "number") return;
    const cell = h.cell;
    const rotation = h.rotation;
    setTurns((t) => {
      const base = t.length === cells ? t.slice() : zeros.slice();
      base[cell] += (rotation - (base[cell] % 4) + 4) % 4;
      return base;
    });
    setLocked((l) => (l.includes(cell) ? l : [...l, cell]));
    flashHint(cell);
  };

  return (
    <PlayLayout
      status={
        <>
          Tap a pipe to turn it.{" "}
          <strong className="text-ink">
            {wetHouses} of {houses}
          </strong>{" "}
          houses have water.
        </>
      }
      freeLeft={session.freeLeft}
      board={
        <PipesBoard
          puzzle={puzzle}
          turns={turns}
          onTurn={(c) => setTurns((t) => (t.length === cells ? t : zeros).map((v, i) => (i === c ? v + 1 : v)))}
          disabled={disabled}
          locked={locked}
          hintCell={hintCell}
        />
      }
      parNote={parNoteFor(session.practice, formatElapsed(game.par * 1000))}
      message={session.message}
      error={session.error}
      onReload={session.reload}
      checking={session.phase === "submitting"}
      actions={
        <PlayActions
          freeLeft={session.freeLeft}
          canAffordHint={session.canAffordHint}
          onHint={onHint}
          hintDisabled={disabled}
          resetLabel="Reset"
          // hinted tiles stay where they are, the rest go back to the start
          onReset={() => setTurns((t) => (t.length === cells ? t : zeros).map((v, i) => (locked.includes(i) ? v : v - (v % 4))))}
          resetDisabled={disabled}
        />
      }
      howTo={game.howTo}
    />
  );
}
