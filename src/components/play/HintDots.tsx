import { COINS } from "@/lib/scoring";

/** "Hints ● ○": one dot per free hint, filled while still available. */
export function HintDots({ freeLeft }: { freeLeft: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-semibold shrink-0" aria-label={`${freeLeft} free hints left`}>
      <span>Hints</span>
      {Array.from({ length: COINS.freeHints }, (_, i) => (
        <span key={i} className={i < freeLeft ? "w-2.5 h-2.5 rounded-full bg-green" : "w-2.5 h-2.5 rounded-full border-2 border-line box-border"} />
      ))}
    </div>
  );
}
