import type { ReactNode } from "react";
import { HintDots } from "./HintDots";
import { Notice } from "./Notice";

/**
 * The frame every game sits in: status line + hint dots, the board,
 * optional extras under the board, par note, notices, actions, how-to.
 */
export function PlayLayout({
  status,
  freeLeft,
  board,
  extras,
  parNote,
  message,
  error,
  onReload,
  actions,
  checking = false,
  howTo,
}: {
  status: ReactNode;
  freeLeft: number;
  board: ReactNode;
  extras?: ReactNode;
  parNote: string;
  message: string | null;
  error: string | null;
  onReload: () => void;
  actions: ReactNode;
  checking?: boolean;
  howTo: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="text-sm text-muted">{status}</div>
        <HintDots freeLeft={freeLeft} />
      </div>
      <div className="px-5 mt-5">{board}</div>
      {extras}
      <div className="text-center text-xs text-muted mt-3.5 px-5">{parNote}</div>
      <Notice text={message} />
      <Notice text={error} actionLabel="Reload" onAction={onReload} />
      {actions}
      {checking && <div className="text-center text-sm text-muted mt-4">Checking…</div>}
      <div className="mx-5 mt-6 px-4 py-3.5 rounded-xl bg-ground text-[13px] text-muted leading-relaxed">
        <strong className="text-ink">How to play.</strong> {howTo}
      </div>
    </div>
  );
}

export function parNoteFor(practice: boolean, parLabel: string): string {
  return practice ? "Practice. No timer pressure, no coins." : `Timer keeps running if you leave this page. Par today is ${parLabel}.`;
}
