"use client";

import { useEffect, useState } from "react";
import { loadState, saveState } from "@/lib/clientState";

/**
 * useState that survives a page reload via localStorage.
 * Loads after mount so server and client render the same first frame.
 */
export function useSavedState<T>(key: string, initial: T, enabled = true): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (enabled) {
      const saved = loadState<T>(key);
      if (saved !== null) setValue(saved);
    }
    setLoaded(true);
  }, [key, enabled]);

  useEffect(() => {
    if (enabled && loaded) saveState(key, value);
  }, [key, value, enabled, loaded]);

  return [value, setValue, loaded];
}
