import type { ReactNode } from "react";

/** Uppercase eyebrow line plus the page heading, with an optional control on the right. */
export function PageTitle({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="px-5 pt-5 flex justify-between items-end gap-3">
      <div>
        <div className="text-[13px] font-semibold text-muted uppercase tracking-wider">{eyebrow}</div>
        <h1 className="display text-[32px] leading-tight mt-1 m-0">{title}</h1>
      </div>
      {right}
    </div>
  );
}
