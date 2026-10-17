import { CopyButton } from "@/components/CopyButton";
import { Header } from "@/components/Header";
import { PageTitle } from "@/components/PageTitle";
import { RedeemButton } from "@/components/RedeemButton";
import { summarise } from "@/lib/accounts";
import { BRANDS, TIERS, brandLabel, listRedemptions } from "@/lib/rewards";
import { COINS_PER_RUPEE, formatCoins, formatDayShort, rupees } from "@/lib/scoring";
import { getAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const account = await getAccount();
  const me = summarise(account);
  const coupons = account ? await listRedemptions(account.id) : [];

  return (
    <main className="col">
      <Header active="rewards" balance={me.balance} streak={me.streak} />

      <PageTitle eyebrow={`${COINS_PER_RUPEE} coins = ₹1`} title="Rewards" />

      <div className="mx-5 mt-4 p-4 rounded-2xl bg-coin flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold">Your coins</div>
          <div className="display tnum text-[34px] leading-tight">{formatCoins(me.balance)}</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold">Worth</div>
          <div className="display tnum text-[26px] leading-tight">{rupees(me.balance)}</div>
        </div>
      </div>

      <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-dashed border-[#C9CDD3] text-xs text-muted leading-relaxed">
        <strong className="text-ink">Demo rewards.</strong> Codes here are sample codes and are not valid at any store. Brand names are shown as text only.
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {TIERS.map((t) => (
          <div key={t.coins} className="card px-4 py-3.5 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <div className="font-bold text-lg">₹{t.rupees} coupon</div>
              <div className="text-sm text-muted tnum">{formatCoins(t.coins)} coins</div>
            </div>
            <RedeemButton tierCoins={t.coins} rupees={t.rupees} balance={me.balance} brands={BRANDS.map((b) => ({ id: b.id, label: b.label }))} />
          </div>
        ))}
      </div>

      <div className="px-5 pt-6">
        <div className="font-bold text-base">My coupons</div>
        {coupons.length === 0 && <div className="mt-2.5 text-[13px] text-muted">Nothing yet. Coupons you get appear here with their code.</div>}
        <div className="flex flex-col gap-2.5 mt-2.5">
          {coupons.map((c) => (
            <div key={c.id} className="card px-4 py-3.5 flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-[15px]">
                  {brandLabel(c.brand)} ₹{c.rupees}
                </div>
                <div className="font-mono text-sm mt-1 tracking-wider">{c.code}</div>
                <div className="text-xs text-muted mt-1">
                  {formatDayShort(c.createdAt.toISOString().slice(0, 10))} · {formatCoins(c.tierCoins)} coins
                </div>
              </div>
              <CopyButton text={c.code} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
