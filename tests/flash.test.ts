import { describe, expect, it } from "vitest";
import { Rng } from "@/lib/games/rng";
import { flashHint, generateFlash, replayFlash, roundLength, validateFlash } from "@/lib/games/flash";

function perfectAttempts(p: ReturnType<typeof generateFlash>): number[][] {
  const out: number[][] = [];
  for (let r = 1; r <= p.rounds; r++) out.push(p.sequence.slice(0, roundLength(p, r)));
  return out;
}

describe("flash", () => {
  it("generates a sequence with no immediate repeats", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const p = generateFlash(new Rng(`flash-${seed}`));
      expect(p.sequence).toHaveLength(p.startLen + p.rounds - 1);
      for (let i = 1; i < p.sequence.length; i++) expect(p.sequence[i]).not.toBe(p.sequence[i - 1]);
      expect(p.sequence.every((c) => c >= 0 && c < p.size * p.size)).toBe(true);
    }
  });

  it("is deterministic for a seed", () => {
    expect(generateFlash(new Rng("same"))).toEqual(generateFlash(new Rng("same")));
  });

  it("a perfect run validates with zero mistakes", () => {
    const p = generateFlash(new Rng("perfect"));
    const v = validateFlash(p, { attempts: perfectAttempts(p) });
    expect(v).toEqual({ ok: true, moves: 0 });
  });

  it("counts mistakes and still solves", () => {
    const p = generateFlash(new Rng("mistakes"));
    const good = perfectAttempts(p);
    const wrong = [good[0][0], (good[0][1] + 1) % 9]; // second tap wrong
    const attempts = [wrong, good[0], [], good[1], ...good.slice(2)];
    const v = validateFlash(p, { attempts });
    expect(v.ok).toBe(true);
    expect(v.moves).toBe(2);
  });

  it("rejects incomplete runs and bad payloads", () => {
    const p = generateFlash(new Rng("incomplete"));
    const good = perfectAttempts(p);
    expect(validateFlash(p, { attempts: good.slice(0, -1) }).ok).toBe(false);
    expect(validateFlash(p, { attempts: [[99]] }).ok).toBe(false);
    expect(validateFlash(p, null).ok).toBe(false);
    expect(replayFlash(p, []).round).toBe(1);
  });

  it("hints the next tile in the current round", () => {
    const p = generateFlash(new Rng("hint"));
    expect(flashHint(p, { attempts: [], taps: [] })).toEqual({ cell: p.sequence[0] });
    expect(flashHint(p, { attempts: [], taps: [p.sequence[0]] })).toEqual({ cell: p.sequence[1] });
    const good = perfectAttempts(p);
    expect(flashHint(p, { attempts: [good[0]], taps: [] })).toEqual({ cell: p.sequence[0] });
    expect(flashHint(p, { attempts: good, taps: [] })).toEqual({ done: true });
  });
});
