"use client";

import { useEffect } from "react";
import { checkZipPath, zipHint, type ZipPublic, type ZipPuzzle } from "@/lib/games/zip";
import { formatElapsed } from "@/lib/scoring";
import { ZipBoard } from "../../boards/ZipBoard";
import { PlayActions } from "../PlayActions";
import { PlayLayout, parNoteFor } from "../PlayLayout";
import { useHintFlash } from "../useHintFlash";
import { useSavedState } from "../useSavedState";
import type { GamePlayProps } from "../types";

export function ZipPlay({ game, session, practiceFull, stateKey }: GamePlayProps) {
  const puzzle = game.puzzle as ZipPublic;
  const [path, setPath] = useSavedState<number[]>(stateKey, [], !session.practice);
  const [hintCell, flashHint] = useHintFlash();
  const disabled = session.phase !== "playing";

  // auto-submit once every cell is covered correctly
  useEffect(() => {
    if (path.length === puzzle.size * puzzle.size && checkZipPath(puzzle, path, true).ok) session.submit({ path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const onHint = async () => {
    const h = (await session.requestHint({ path }, () => zipHint(practiceFull as ZipPuzzle, { path }))) as Record<string, unknown> | null;
    if (!h || "done" in h) return;
    if (typeof h.next === "number") {
      setPath((p) => [...p, h.next as number]);
      flashHint(h.next);
      session.setMessage(null);
    } else if (typeof h.keep === "number") {
      const keep = h.keep;
      setPath((p) => p.slice(0, keep));
      session.setMessage(keep === 0 ? "The path must start at 1. We cleared it." : `Your path went wrong after box ${keep}. We trimmed it.`);
    }
  };

  return (
    <PlayLayout
      status={
        <>
          Draw from <strong className="text-ink">1</strong> to <strong className="text-ink">{puzzle.numbers.length}</strong> through every box
        </>
      }
      freeLeft={session.freeLeft}
      board={<ZipBoard puzzle={puzzle} path={path} onChange={setPath} disabled={disabled} hintCell={hintCell} />}
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
          resetLabel="Clear path"
          onReset={() => {
            session.setMessage(null);
            setPath([]);
          }}
          resetDisabled={disabled}
        />
      }
      howTo={game.howTo}
    />
  );
}
