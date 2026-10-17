import type { CoinLine } from "@/lib/play";
import { CoinIcon } from "../Icons";

const LABEL: Record<CoinLine["reason"], (game: string, streak: number) => string> = {
  solve: (g) => `Solved ${g}`,
  under_par: () => "Under par, no hints",
  full_set: () => "All puzzles done today",
  streak: (_g, s) => `Streak, day ${s}`,
};

/** Itemised coins for one solve, with a yellow total row. */
export function CoinTable({ coins, gameName, streak }: { coins: CoinLine[]; gameName: string; streak: number }) {
  if (coins.length === 0) return null;
  const total = coins.reduce((s, c) => s + c.amount, 0);
  return (
    <div className="card mt-6 overflow-hidden">
      {coins.map((c, i) => (
        <div key={i} className="flex justify-between px-4 py-3.5 border-b border-line text-[15px]">
          <span>{LABEL[c.reason](gameName, streak)}</span>
          <span className="font-bold tnum">+{c.amount}</span>
        </div>
      ))}
      <div className="flex justify-between items-center px-4 py-3.5 bg-coin text-[15px] font-bold">
        <span className="flex items-center gap-2">
          <CoinIcon />
          <span>Coins earned</span>
        </span>
        <span className="tnum">+{total}</span>
      </div>
    </div>
  );
}
