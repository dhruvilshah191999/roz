import { COINS } from "@/lib/scoring";
import { BulbIcon } from "../Icons";

export function hintLabel(freeLeft: number, canAfford: boolean): string {
  if (freeLeft > 0) return `Hint · ${freeLeft} free`;
  return canAfford ? `Hint · ${COINS.hintCost} coins` : "Hint · no coins";
}

/** The two buttons under every board: Hint and a game-specific reset. */
export function PlayActions({
  freeLeft,
  canAffordHint,
  onHint,
  hintDisabled = false,
  resetLabel,
  onReset,
  resetDisabled = false,
}: {
  freeLeft: number;
  canAffordHint: boolean;
  onHint: () => void;
  hintDisabled?: boolean;
  resetLabel: string;
  onReset: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3 px-5 mt-6">
      <button type="button" className="btn btn-secondary flex-1" onClick={onHint} disabled={hintDisabled || !canAffordHint}>
        <BulbIcon />
        <span>{hintLabel(freeLeft, canAffordHint)}</span>
      </button>
      <button type="button" className="btn btn-tertiary flex-1" onClick={onReset} disabled={resetDisabled}>
        {resetLabel}
      </button>
    </div>
  );
}
