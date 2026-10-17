import type { DailyGameView } from "@/lib/daily";
import type { GameSession } from "./useGameSession";

/** What every game's play component receives. */
export interface GamePlayProps {
  game: DailyGameView;
  session: GameSession;
  /** Full puzzle with solution, practice only. */
  practiceFull: unknown | null;
  /** localStorage key for this day + game */
  stateKey: string;
}
