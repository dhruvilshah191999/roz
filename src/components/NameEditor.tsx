"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NameEditor({ current }: { current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className="text-[13px] font-semibold underline underline-offset-4" onClick={() => setOpen(true)}>
        Change name
      </button>
    );
  }

  return (
    <form
      className="flex gap-2 mt-1"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          const res = await fetch("/api/account/name", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
          const data = await res.json();
          if (!res.ok) {
            setErr(data.error ?? "Could not save");
            return;
          }
          setOpen(false);
          router.refresh();
        } catch {
          setErr("Could not save");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="field h-10 text-sm" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
      <button type="submit" className="btn btn-primary btn-sm h-10" disabled={busy}>
        Save
      </button>
      {err && <div className="text-xs text-ink">{err}</div>}
    </form>
  );
}
