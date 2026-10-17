import Link from "next/link";
import { BackIcon } from "./Icons";

export function PlayBar({ backHref, backLabel, title, right }: { backHref: string; backLabel: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-2.5 border-b border-line">
      <Link href={backHref} className="flex items-center gap-1.5 h-11 px-2.5 font-semibold text-sm text-ink">
        <BackIcon />
        <span>{backLabel}</span>
      </Link>
      <div className="display text-xl">{title}</div>
      <div className="min-w-16 flex justify-end">{right}</div>
    </div>
  );
}
