"use client";

import { useState } from "react";

export function ShareButton({ text, className = "btn btn-secondary" }: { text: string; className?: string }) {
  const [label, setLabel] = useState("Share my result");
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          if (typeof navigator.share === "function") {
            await navigator.share({ text });
            return;
          }
          await navigator.clipboard.writeText(text);
          setLabel("Copied");
          setTimeout(() => setLabel("Share my result"), 1500);
        } catch {
          /* user cancelled or clipboard blocked */
        }
      }}
    >
      {label}
    </button>
  );
}
