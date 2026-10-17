"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A cell to highlight for a short moment after a hint. */
export function useHintFlash(ms = 2800): [number | null, (cell: number) => void] {
  const [cell, setCell] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const flash = useCallback(
    (c: number) => {
      setCell(c);
      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCell(null), ms);
    },
    [ms],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return [cell, flash];
}
