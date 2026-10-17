import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Header } from "@/components/Header";
import { LockIcon, ShieldIcon } from "@/components/Icons";
import { NameEditor } from "@/components/NameEditor";
import { StatTile } from "@/components/StatTile";
import { countSolved, summarise } from "@/lib/accounts";
import { getGame } from "@/lib/games";
import { describeReason, recentLedger } from "@/lib/ledger";
import { dayInIST, formatCoins, formatDayShort } from "@/lib/scoring";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

function when(d: Date, today: string): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(d);
  if (day === today) return `Today ${time}`;
  return formatDayShort(day);
}

export default async function MePage() {
  const account = await getAccount();
  const me = summarise(account);
  const solved = account ? await countSolved(account.id) : 0;
  const rows = account ? await recentLedger(account.id) : [];
  const today = dayInIST();
  const initial = me.displayName.charAt(0).toUpperCase();

  return (
    <main className="col">
      <Header active="me" balance={me.balance} streak={me.streak} />

      <div className="px-5 pt-5 flex items-center gap-3.5">
        <div className="display w-14 h-14 rounded-full bg-blue-tint flex items-center justify-center text-[22px]">{initial}</div>
        <div className="flex-1 min-w-0">
          <h1 className="display text-2xl m-0 truncate">{me.displayName}</h1>
          <NameEditor current={me.displayName} />
        </div>
        <div className="text-right">
          <div className="text-xs text-muted font-semibold">Level</div>
          <div className="display text-[28px] leading-none">{me.level.level}</div>
        </div>
      </div>

      <div className="mx-5 mt-3.5">
        <div className="h-2.5 rounded-full bg-ground overflow-hidden">
          <div className="h-2.5 bg-green" style={{ width: `${Math.round(me.level.progress * 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1.5">
          <span>{formatCoins(me.lifetimeEarned)} lifetime coins</span>
          <span>
            Level {me.level.level + 1} at {formatCoins(me.level.next)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-5 pt-4">
        <StatTile value={me.streak} label="Streak" />
        <StatTile value={me.bestStreak} label="Best streak" />
        <StatTile value={solved} label="Solved" />
      </div>

      <div className="mx-5 mt-2 text-xs text-muted flex items-center gap-1.5">
        <ShieldIcon />
        <span>{me.shieldAvailable ? "1 streak shield left this week: one missed day will not break your streak." : "Streak shield used this week."}</span>
      </div>

      {me.isProtected ? (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-green-tint flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <LockIcon stroke="#1D7A4A" size={22} />
            <div className="font-bold text-base">Protected</div>
          </div>
          <div className="text-[13px] text-muted leading-relaxed">Use your account code and PIN on any phone or browser to get your coins back.</div>
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-white border-[1.5px] border-line">
            <div>
              <div className="text-[11px] text-muted font-semibold uppercase tracking-wider">Account code</div>
              <div className="font-mono text-lg font-bold tracking-wider mt-0.5">{me.code}</div>
            </div>
            <CopyButton text={me.code ?? ""} />
          </div>
          <Link href="/me/pin" className="btn btn-secondary h-12 text-[15px]">
            Change PIN
          </Link>
        </div>
      ) : (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-amber flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <LockIcon size={22} />
            <div className="font-bold text-base">Coins not protected</div>
          </div>
          <div className="text-[13px] text-muted leading-relaxed">
            If you change phone or browser, your coins stay only if you set a PIN. Your account code is below.
          </div>
          {me.exists ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-white border-[1.5px] border-line">
              <div>
                <div className="text-[11px] text-muted font-semibold uppercase tracking-wider">Account code</div>
                <div className="font-mono text-lg font-bold tracking-wider mt-0.5">{me.code}</div>
              </div>
              <CopyButton text={me.code ?? ""} />
            </div>
          ) : (
            <div className="text-[13px] text-muted">Your account is created when you open your first puzzle.</div>
          )}
          <Link href="/me/pin" className="btn btn-primary h-12 text-[15px]">
            Set a 4-digit PIN
          </Link>
        </div>
      )}

      <div className="px-5 pt-6 flex justify-between items-baseline">
        <div className="font-bold text-base">Coin history</div>
        <div className="text-xs text-muted">Every earn and spend</div>
      </div>
      <div className="mx-5 mt-2.5 card overflow-hidden">
        {rows.length === 0 && <div className="px-4 py-5 text-center text-sm text-muted">No coins yet. Solve a puzzle to earn your first ones.</div>}
        {rows.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-line text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{describeReason(l, l.refGame ? getGame(l.refGame)?.name : undefined)}</div>
              <div className="text-xs text-muted">{when(l.createdAt, today)}</div>
            </div>
            <div className={`tnum font-bold ${l.amount > 0 ? "text-green" : "text-ink"}`}>
              {l.amount > 0 ? "+" : ""}
              {formatCoins(l.amount)}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pt-5 flex gap-4 text-[13px]">
        <Link href="/restore" className="underline underline-offset-4 font-semibold">
          Restore another account
        </Link>
        <Link href="/rewards" className="underline underline-offset-4 font-semibold text-muted">
          How coins work
        </Link>
      </div>
    </main>
  );
}
