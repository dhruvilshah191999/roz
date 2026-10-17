import { formatElapsed } from "@/lib/scoring";

/** Small pill in the play bar: elapsed time, or any short label. */
export function Clock({ ms, label }: { ms?: number; label?: string }) {
  return (
    <div className="tnum h-9 min-w-16 px-3 rounded-[10px] bg-ground flex items-center justify-center font-bold text-sm whitespace-nowrap" aria-label={label ? undefined : "Time"}>
      {label ?? formatElapsed(ms ?? 0)}
    </div>
  );
}
