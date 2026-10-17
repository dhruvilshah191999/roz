"use client";

import { useEffect } from "react";
import { purgeOtherDays } from "@/lib/clientState";

/** Drops saved boards from earlier days. Renders nothing. */
export function PurgeOldDays({ day }: { day: string }) {
  useEffect(() => {
    purgeOtherDays(day);
  }, [day]);
  return null;
}
