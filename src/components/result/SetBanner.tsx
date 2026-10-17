import { COINS } from "@/lib/scoring";

/** Dark strip: how many puzzles are left for the set bonus, or the streak once the set is done. */
export function SetBanner({ setDone, remaining, streak, usedShield }: { setDone: boolean; remaining: number; streak: number; usedShield: boolean }) {
  return (
    <div className="mt-3.5 px-4 py-3 rounded-xl bg-dark text-white flex justify-between items-center text-sm">
      {setDone ? (
        <>
          <span>All puzzles done. Streak day {streak}.</span>
          <span className="text-coin font-bold">{usedShield ? "Shield used" : "Nice"}</span>
        </>
      ) : (
        <>
          <span>
            {remaining} more {remaining === 1 ? "puzzle" : "puzzles"} for the set bonus
          </span>
          <span className="text-coin font-bold">+{COINS.fullSet}</span>
        </>
      )}
    </div>
  );
}
