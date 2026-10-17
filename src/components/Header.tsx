import Link from "next/link";
import { CoinIcon, FlameIcon } from "./Icons";
import { formatCoins } from "@/lib/scoring";

export type Tab = "play" | "ranks" | "rewards" | "me";

const TABS: Array<{ id: Tab; href: string; label: string }> = [
  { id: "play", href: "/", label: "Play" },
  { id: "ranks", href: "/ranks", label: "Ranks" },
  { id: "rewards", href: "/rewards", label: "Rewards" },
  { id: "me", href: "/me", label: "Me" },
];

export function Header({ active, balance, streak }: { active: Tab; balance: number; streak: number }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <Link href="/" className="display text-[22px]">
          Roz
        </Link>
        <div className="flex gap-2">
          <Link href="/rewards" className="pill bg-coin" aria-label={`${balance} coins`}>
            <CoinIcon />
            <span className="tnum">{formatCoins(balance)}</span>
          </Link>
          <div className="pill bg-ground" aria-label={`${streak} day streak`}>
            <FlameIcon />
            <span className="tnum">
              {streak} {streak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
      </div>
      <nav aria-label="Main" className="flex gap-0.5 px-3 pt-2.5 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={
              t.id === active
                ? "px-3 py-2.5 text-sm font-bold text-ink border-b-2 border-ink -mb-px"
                : "px-3 py-2.5 text-sm font-semibold text-muted"
            }
            aria-current={t.id === active ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
