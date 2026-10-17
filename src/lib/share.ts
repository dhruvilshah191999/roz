import { countLabel, type GameId } from "./games";
import { formatDayShort, formatElapsed } from "./scoring";

export interface ShareLine {
  id: GameId;
  name: string;
  parType: "time" | "moves";
  unit: "moves" | "mistakes";
  elapsedMs: number | null;
  moves: number | null;
}

/** The text the Share button copies. Plain text so it works in any messaging app. */
export function buildShareText(
  day: string,
  lines: ShareLine[],
  streak: number,
  siteUrl: string,
  override?: { id: GameId; elapsedMs: number; moves: number | null },
): string {
  const parts = lines.map((l) => {
    const v = override && override.id === l.id ? override : l;
    if (l.parType === "time") return `${l.name} ${v.elapsedMs !== null ? formatElapsed(v.elapsedMs) : "–"}`;
    return `${l.name} ${v.moves !== null ? countLabel(v.moves, l.unit) : "–"}`;
  });
  return `Roz · ${formatDayShort(day)}\n${parts.join(" · ")}\nStreak ${streak} · ${siteUrl}`;
}
