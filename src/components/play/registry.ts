import type { ComponentType } from "react";
import type { GameId } from "@/lib/games";
import { FlashPlay } from "./games/FlashPlay";
import { PipesPlay } from "./games/PipesPlay";
import { ZipPlay } from "./games/ZipPlay";
import type { GamePlayProps } from "./types";

/** Client-side counterpart of the engine registry: which component plays each game. */
export const PLAY_COMPONENTS: Record<GameId, ComponentType<GamePlayProps>> = {
  zip: ZipPlay,
  pipes: PipesPlay,
  flash: FlashPlay,
};
