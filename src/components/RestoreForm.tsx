"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CoinIcon } from "./Icons";
import { formatCoins } from "@/lib/scoring";

export function RestoreForm({ localCoins, localProtected }: { localCoins: number; localProtected: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not restore");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErr("Could not restore. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="px-5 pt-6">
        <h1 className="display text-[28px] leading-tight m-0">Played before on another phone?</h1>
        <p className="text-sm text-muted mt-2 mb-0 leading-relaxed">Enter the account code and PIN from your old phone. Your coins, streak and rank come to this phone.</p>
      </div>

      <form className="flex flex-col gap-4 px-5 pt-6" onSubmit={submit}>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">Account code</span>
          <input
            className="field font-mono text-lg tracking-wider uppercase"
            placeholder="MANGO-7342"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="text-xs text-muted">A word and four numbers. Find it on the Me page of your old phone.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">4-digit PIN</span>
          <input
            className="field text-[22px] tracking-[8px]"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            autoComplete="off"
            placeholder="••••"
          />
        </label>

        {localCoins > 0 && (
          <div className="px-3.5 py-3 rounded-xl bg-green-tint flex gap-2.5 items-start text-[13px] leading-relaxed">
            <CoinIcon size={20} className="shrink-0 mt-0.5" />
            <span>
              <strong>You earned {formatCoins(localCoins)} coins on this phone.</strong> They will be added to the account you restore. If that account already solved the same puzzle on the same day, the coins for it are not added again.
            </span>
          </div>
        )}
        {localProtected && (
          <div className="px-3.5 py-3 rounded-xl bg-amber text-[13px] leading-relaxed">
            This phone already has a protected account. Restoring another one moves this phone&apos;s coins into it and removes this account.
          </div>
        )}
        {err && <div className="text-[13px] px-3 py-2 rounded-lg bg-amber">{err}</div>}

        <button type="submit" className="btn btn-primary" disabled={busy || !/^[A-Z]+-\d{4}$/.test(code.trim()) || pin.length !== 4}>
          {busy ? "Restoring…" : "Restore my account"}
        </button>
      </form>

      <div className="mx-5 mt-6 px-4 py-3.5 rounded-xl bg-ground text-[13px] text-muted leading-relaxed">
        <div className="font-bold text-ink mb-1">If you did not set a PIN</div>
        Coins on a phone without a PIN cannot be moved. Keep playing here and set a PIN today on the Me page so this does not happen again.
      </div>
      <div className="mx-5 mt-4 text-[13px] text-muted leading-relaxed">Wrong PIN five times locks restore for one hour. We never ask for your phone number or email.</div>
    </>
  );
}
