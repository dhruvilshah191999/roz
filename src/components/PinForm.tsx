"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyButton } from "./CopyButton";

export function PinForm({ code: initialCode, isProtected }: { code: string | null; isProtected: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [oldPin, setOldPin] = useState("");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // a brand-new visitor has no account yet; create it so the code can be shown
  useEffect(() => {
    if (code) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d?.code && setCode(d.code))
      .catch(() => {});
  }, [code]);

  const valid = /^\d{4}$/.test(pin1) && pin1 === pin2 && (!isProtected || /^\d{4}$/.test(oldPin));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: pin1, oldPin: isProtected ? oldPin : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not save PIN");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setErr("Could not save. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="px-5 pt-8 flex flex-col items-center text-center gap-4">
        <div className="pop w-[72px] h-[72px] rounded-full bg-green flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <path d="M8 18l7 7 13-14" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="display text-[28px] m-0">Coins protected</h1>
        <p className="text-sm text-muted m-0 leading-relaxed">
          On a new phone, open Roz, tap Restore account, and enter <strong className="font-mono text-ink">{code}</strong> with your PIN.
        </p>
        <Link href="/me" className="btn btn-primary w-full mt-2">
          Back to Me
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-6">
        <h1 className="display text-[28px] leading-tight m-0">{isProtected ? "Change your PIN" : "Keep your coins on any phone"}</h1>
        <p className="text-sm text-muted mt-2 mb-0 leading-relaxed">
          {isProtected
            ? "Enter your current PIN, then choose a new one."
            : "Two things get you back in on a new phone or browser: your account code and a PIN you choose now."}
        </p>
      </div>

      <div className="mx-5 mt-5 px-4 py-3.5 rounded-[14px] border-[1.5px] border-ink flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Step 1 · Your account code</div>
          <div className="font-mono text-2xl font-bold tracking-wider mt-1">{code ?? "…"}</div>
          <div className="text-xs text-muted mt-1">Write it down or send it to yourself on WhatsApp.</div>
        </div>
        {code && <CopyButton text={code} />}
      </div>

      <form className="flex flex-col gap-4 px-5 pt-5" onSubmit={submit}>
        <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Step 2 · {isProtected ? "New PIN" : "Choose a PIN"}</div>
        {isProtected && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold">Current PIN</span>
            <input className="field text-[22px] tracking-[8px]" type="password" inputMode="numeric" maxLength={4} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} autoComplete="current-password" />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">4-digit PIN</span>
          <input className="field text-[22px] tracking-[8px]" type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={(e) => setPin1(e.target.value.replace(/\D/g, ""))} autoComplete="new-password" placeholder="••••" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">Same PIN again</span>
          <input className="field text-[22px] tracking-[8px]" type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} autoComplete="new-password" placeholder="••••" />
        </label>
        {pin1.length === 4 && pin2.length === 4 && pin1 !== pin2 && <div className="text-[13px] px-3 py-2 rounded-lg bg-amber">The two PINs are different.</div>}
        <div className="px-3.5 py-3 rounded-xl bg-amber text-[13px] leading-relaxed">
          <strong>We cannot reset a forgotten PIN.</strong> There is no phone number or email on your account, so there is nothing to send a reminder to. Pick one you will remember.
        </div>
        {err && <div className="text-[13px] px-3 py-2 rounded-lg bg-amber">{err}</div>}
        <button type="submit" className="btn btn-primary" disabled={!valid || busy || !code}>
          {busy ? "Saving…" : "Save PIN"}
        </button>
      </form>
    </>
  );
}
