/** Browser-only helpers for saving an in-progress board between visits. */

const PREFIX = "roz:";

export function stateKey(day: string, game: string): string {
  return `${PREFIX}${day}:${game}`;
}

export function loadState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable; the game still works for this visit */
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Drop saved boards from other days so storage never grows. */
export function purgeOtherDays(day: string): void {
  try {
    const keep = `${PREFIX}${day}:`;
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && !k.startsWith(keep)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
