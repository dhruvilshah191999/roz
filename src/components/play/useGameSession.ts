"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearState } from "@/lib/clientState";
import type { ResultView } from "@/lib/daily";
import type { GameId } from "@/lib/games";
import type { CoinLine } from "@/lib/play";
import { COINS } from "@/lib/scoring";

export type SessionPhase = "playing" | "submitting" | "solved";

export interface Outcome {
  elapsedMs: number;
  moves: number | null;
  underPar: boolean;
  hintsUsed: number;
  coins: CoinLine[];
  setDone: boolean;
  solvedCount: number;
  streak: number;
  usedShield: boolean;
  firstSolveEver: boolean;
}

export interface SessionOptions {
  day: string;
  gameId: GameId;
  practice: boolean;
  serverNow: string;
  stateKey: string;
  initialResult: ResultView | null;
  initialBalance: number;
  /** used to fill the outcome for an already-solved game */
  initialCoins: CoinLine[];
  solvedCount: number;
  totalGames: number;
  streak: number;
}

export interface GameSession {
  phase: SessionPhase;
  practice: boolean;
  /** ms since the server stamped the start */
  elapsedMs: number;
  started: boolean;
  outcome: Outcome | null;
  error: string | null;
  message: string | null;
  setError: (m: string | null) => void;
  setMessage: (m: string | null) => void;
  balance: number;
  hintsUsed: number;
  freeLeft: number;
  canAffordHint: boolean;
  /** Ask for a hint. In practice, `local` computes it on the client. Returns the payload or null. */
  requestHint: (state: unknown, local: () => unknown) => Promise<unknown>;
  /** Send the finished solution to the server (daily) or finish locally (practice). */
  submit: (solution: unknown, practiceMoves?: number | null) => void;
  /** For count-based games: the number shown in the play bar. */
  count: number;
  setCount: (n: number) => void;
  reload: () => void;
}

const post = async (url: string, body: unknown) => {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
};

/** Everything a daily or practice game needs that is not the board itself. */
export function useGameSession(o: SessionOptions): GameSession {
  const router = useRouter();
  const alreadySolved = !!o.initialResult?.solvedAt && !o.practice;

  const [phase, setPhase] = useState<SessionPhase>(alreadySolved ? "solved" : "playing");
  const [outcome, setOutcome] = useState<Outcome | null>(() => {
    const r = o.initialResult;
    if (!r?.solvedAt || o.practice) return null;
    return {
      elapsedMs: r.elapsedMs ?? 0,
      moves: r.moves,
      underPar: r.underPar,
      hintsUsed: r.hintsUsed,
      coins: o.initialCoins,
      setDone: o.solvedCount >= o.totalGames,
      solvedCount: o.solvedCount,
      streak: o.streak,
      usedShield: false,
      firstSolveEver: false,
    };
  });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState(o.initialBalance);
  const [hintsUsed, setHintsUsed] = useState(o.initialResult?.hintsUsed ?? 0);
  const [count, setCount] = useState(0);
  const submitting = useRef(false);

  // stamp the start on the server (once), or now for practice
  useEffect(() => {
    if (phase === "solved") return;
    if (o.practice) {
      setStartedAt(Date.now());
      return;
    }
    const offset = new Date(o.serverNow).getTime() - Date.now();
    if (o.initialResult?.startedAt) {
      setStartedAt(new Date(o.initialResult.startedAt).getTime() - offset);
      return;
    }
    let cancelled = false;
    post(`/api/games/${o.gameId}/start`, { day: o.day })
      .then(({ data }) => {
        if (cancelled) return;
        if (!data?.result?.startedAt) {
          setError(data?.error ?? "Could not start. Reload the page.");
          return;
        }
        const serverStart = new Date(data.result.startedAt).getTime();
        const serverNow = data.now ? new Date(data.now).getTime() : serverStart;
        setStartedAt(serverStart - (serverNow - Date.now()));
      })
      .catch(() => setError("Could not start. Check your connection and reload."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.stateKey]);

  // display clock
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [phase]);

  const freeLeft = Math.max(0, COINS.freeHints - hintsUsed);
  const canAffordHint = freeLeft > 0 || balance >= COINS.hintCost;

  const requestHint = useCallback(
    async (state: unknown, local: () => unknown): Promise<unknown> => {
      setError(null);
      if (o.practice) {
        setHintsUsed((h) => h + 1);
        return local();
      }
      try {
        const { status, data } = await post(`/api/games/${o.gameId}/hint`, { day: o.day, state });
        if (status >= 400) {
          setError(data.error ?? "No hint right now");
          return null;
        }
        setHintsUsed(data.hintsUsed);
        setBalance(data.balance);
        return data.hint;
      } catch {
        setError("Could not get a hint. Check your connection.");
        return null;
      }
    },
    [o.practice, o.gameId, o.day],
  );

  const submit = useCallback(
    (solution: unknown, practiceMoves: number | null = null) => {
      if (submitting.current || phase !== "playing") return;
      submitting.current = true;
      const elapsedMs = startedAt ? Math.max(0, Date.now() - startedAt) : 0;
      if (o.practice) {
        setOutcome({
          elapsedMs,
          moves: practiceMoves,
          underPar: false,
          hintsUsed,
          coins: [],
          setDone: false,
          solvedCount: o.solvedCount,
          streak: o.streak,
          usedShield: false,
          firstSolveEver: false,
        });
        setPhase("solved");
        return;
      }
      setPhase("submitting");
      post(`/api/games/${o.gameId}/submit`, { day: o.day, solution })
        .then(({ status, data }) => {
          if (status === 409) {
            router.refresh();
            return;
          }
          if (!data.ok) {
            setError(data.error ?? "Could not save. Tap to try again.");
            setPhase("playing");
            submitting.current = false;
            return;
          }
          clearState(o.stateKey);
          setBalance(data.balance);
          setOutcome({
            elapsedMs: data.result.elapsedMs,
            moves: data.result.moves,
            underPar: data.result.underPar,
            hintsUsed: data.result.hintsUsed,
            coins: data.coins,
            setDone: data.setDone,
            solvedCount: data.solvedCount,
            streak: data.streak,
            usedShield: data.usedShield,
            firstSolveEver: data.firstSolveEver,
          });
          setPhase("solved");
        })
        .catch(() => {
          setError("Could not save. Check your connection and tap again.");
          setPhase("playing");
          submitting.current = false;
        });
    },
    [phase, startedAt, o.practice, o.gameId, o.day, o.stateKey, o.solvedCount, o.streak, hintsUsed, router],
  );

  return {
    phase,
    practice: o.practice,
    elapsedMs: startedAt ? Math.max(0, now - startedAt) : 0,
    started: startedAt !== null,
    outcome,
    error,
    message,
    setError,
    setMessage,
    balance,
    hintsUsed,
    freeLeft,
    canAffordHint,
    requestHint,
    submit,
    count,
    setCount,
    reload: () => router.refresh(),
  };
}
