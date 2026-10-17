"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCoins } from "@/lib/scoring";

export function RedeemButton({
  tierCoins,
  rupees,
  balance,
  brands,
}: {
  tierCoins: number;
  rupees: number;
  balance: number;
  brands: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [brand, setBrand] = useState(brands[0].id);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const can = balance >= tierCoins;

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tierCoins, brand }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not redeem");
        return;
      }
      setCode(data.code);
      router.refresh();
    } catch {
      setErr("Could not redeem. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Brand">
        {brands.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={brand === b.id}
            onClick={() => setBrand(b.id)}
            className={`px-3 h-8 rounded-full text-[13px] font-semibold ${brand === b.id ? "bg-ink text-white" : "bg-ground text-ink"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {code ? (
        <div className="px-3.5 py-3 rounded-xl bg-green-tint text-[13px]">
          <div className="font-bold">Done. Your {brands.find((b) => b.id === brand)?.label} ₹{rupees} code:</div>
          <div className="font-mono text-base mt-1 tracking-wider">{code}</div>
        </div>
      ) : (
        <button type="button" className={`btn h-11 text-[15px] ${can ? "btn-primary" : "bg-ground text-muted"}`} disabled={!can || busy} onClick={go}>
          {can ? (busy ? "Getting code…" : "Get coupon") : `${formatCoins(tierCoins - balance)} more coins`}
        </button>
      )}
      {err && <div className="px-3 py-2 rounded-lg bg-amber text-[13px]">{err}</div>}
    </>
  );
}
