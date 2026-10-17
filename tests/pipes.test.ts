import { describe, expect, it } from "vitest";
import { Rng } from "@/lib/games/rng";
import { E, N, S, W, flow, generatePipes, isPipesSolved, pipesHint, rotateMask, toPipesPublic, validatePipes } from "@/lib/games/pipes";

describe("pipes", () => {
  it("rotates masks clockwise", () => {
    expect(rotateMask(N, 1)).toBe(E);
    expect(rotateMask(E, 1)).toBe(S);
    expect(rotateMask(S, 1)).toBe(W);
    expect(rotateMask(W, 1)).toBe(N);
    expect(rotateMask(N | S, 2)).toBe(N | S);
    expect(rotateMask(N | E, 4)).toBe(N | E);
  });

  it("generates a solvable, not-yet-solved puzzle", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const p = generatePipes(new Rng(`pipes-${seed}`));
      const pub = toPipesPublic(p);
      const n = p.size * p.size;
      const houses = p.kinds.filter((k) => k === "house").length;
      expect(houses).toBeGreaterThanOrEqual(3);
      expect(p.kinds[p.source]).toBe("source");

      // solved state: every house wet
      const wetSolved = flow(p.size, p.solution, p.source);
      p.kinds.forEach((k, i) => {
        if (k === "house") expect(wetSolved.has(i)).toBe(true);
      });

      // initial state is not solved
      expect(isPipesSolved(pub, new Array(n).fill(0))).toBe(false);

      // rotations that reach the solution validate
      const rotations = p.initial.map((m, i) => {
        for (let r = 0; r < 4; r++) if (rotateMask(m, r) === p.solution[i]) return r;
        throw new Error("no rotation reaches solution");
      });
      expect(validatePipes(p, { rotations }).ok).toBe(true);
    }
  });

  it("rejects bad payloads", () => {
    const p = generatePipes(new Rng("bad"));
    expect(validatePipes(p, { rotations: [] }).ok).toBe(false);
    expect(validatePipes(p, { rotations: new Array(25).fill(7) }).ok).toBe(false);
    expect(validatePipes(p, null).ok).toBe(false);
  });

  it("hints a wrong tile with a fixing rotation, until solved", () => {
    const p = generatePipes(new Rng("hint"));
    const n = p.size * p.size;
    const rotations = new Array<number>(n).fill(0);
    let guard = 0;
    while (!isPipesSolved(toPipesPublic(p), rotations) && guard++ < 50) {
      const h = pipesHint(p, { rotations });
      expect(h).not.toBeNull();
      if (h && "cell" in h) {
        rotations[h.cell] = h.rotation;
      }
    }
    expect(isPipesSolved(toPipesPublic(p), rotations)).toBe(true);
    expect(pipesHint(p, { rotations })).toEqual({ done: true });
  });
});
