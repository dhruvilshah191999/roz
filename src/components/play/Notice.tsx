/** Amber inline message. With `onAction` it shows an action link on the right. */
export function Notice({ text, actionLabel, onAction }: { text: string | null; actionLabel?: string; onAction?: () => void }) {
  if (!text) return null;
  return (
    <div className="mx-5 mt-3 px-3.5 py-2.5 rounded-xl bg-amber text-[13px] flex items-center justify-between gap-3">
      <span>{text}</span>
      {actionLabel && onAction && (
        <button type="button" className="font-bold underline" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
