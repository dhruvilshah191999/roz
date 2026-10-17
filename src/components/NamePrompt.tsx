"use client";

import { useState } from "react";

export function NamePrompt({ onDone }: { onDone: (name: string | null) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/name", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not save");
        return;
      }
      onDone(body.skip ? null : (data.displayName as string));
    } catch {
      setErr("Could not save. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="card p-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void send({ name });
      }}
    >
      <div className="font-bold text-[15px]">Your name for Ranks</div>
      <input
        className="field"
        placeholder="Example: Riya"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="nickname"
      />
      {err && <div className="text-[13px] text-ink bg-amber rounded-lg px-3 py-2">{err}</div>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1 h-11 text-[15px]" disabled={busy || name.trim().length < 2}>
          Save
        </button>
        <button type="button" className="btn btn-tertiary flex-1 h-11 text-[15px]" disabled={busy} onClick={() => void send({ skip: true })}>
          Skip
        </button>
      </div>
    </form>
  );
}
