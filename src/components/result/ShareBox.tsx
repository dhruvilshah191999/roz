/** Shows the exact text the Share button copies. */
export function ShareBox({ text }: { text: string }) {
  return (
    <div className="mt-4 px-4 py-3.5 rounded-xl bg-ground text-[13px] text-muted leading-relaxed">
      <div className="font-semibold text-ink mb-1.5">Share copies this text</div>
      <pre className="font-mono text-xs text-ink whitespace-pre-wrap m-0">{text}</pre>
    </div>
  );
}
