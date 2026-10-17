import { describe, expect, it } from "vitest";
import { Rng } from "@/lib/games/rng";
import { checkZipPath, generateZip, isAdjacent, toZipPublic, validateZip, wallKey, zipHint } from "@/lib/games/zip";

describe("zip", () => {
  it("generates a puzzle whose own solution validates", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const p = generateZip(new Rng(`test-${seed}`));
      expect(p.solution).toHaveLength(p.size * p.size);
      expect(new Set(p.solution).size).toBe(p.size * p.size);
      expect(p.numbers[0]).toBe(p.solution[0]);
      expect(p.numbers[p.numbers.length - 1]).toBe(p.solution[p.solution.length - 1]);
      for (let i = 0; i + 1 < p.solution.length; i++) {
        expect(isAdjacent(p.size, p.solution[i], p.solution[i + 1])).toBe(true);
      }
      const wallSet = new Set(p.walls.map(([a, b]) => wallKey(a, b)));
      for (let i = 0; i + 1 < p.solution.length; i++) {
        expect(wallSet.has(wallKey(p.solution[i], p.solution[i + 1]))).toBe(false);
      }
      expect(validateZip(p, { path: p.solution }).ok).toBe(true);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateZip(new Rng("same"));
    const b = generateZip(new Rng("same"));
    expect(a).toEqual(b);
  });

  it("rejects wrong paths", () => {
    const p = generateZip(new Rng("reject"));
    expect(validateZip(p, { path: p.solution.slice(0, -1) }).ok).toBe(false);
    expect(validateZip(p, { path: p.solution.slice().reverse() }).ok).toBe(false);
    expect(validateZip(p, { path: [] }).ok).toBe(false);
    expect(validateZip(p, { path: "nope" }).ok).toBe(false);
    const swapped = p.solution.slice();
    [swapped[3], swapped[4]] = [swapped[4], swapped[3]];
    expect(validateZip(p, { path: swapped }).ok).toBe(false);
  });

  it("reports the longest valid prefix", () => {
    const p = generateZip(new Rng("prefix"));
    const pub = toZipPublic(p);
    const good = p.solution.slice(0, 10);
    expect(checkZipPath(pub, good, false)).toEqual({ ok: true, validPrefix: 10 });
    const bad = good.concat([good[2]]);
    expect(checkZipPath(pub, bad, false).validPrefix).toBe(10);
  });

  it("hints the next cell and trims wrong paths", () => {
    const p = generateZip(new Rng("hint"));
    expect(zipHint(p, { path: [] })).toEqual({ next: p.numbers[0] });
    const h = zipHint(p, { path: p.solution.slice(0, 5) });
    expect("next" in h).toBe(true);
    if ("next" in h) {
      const extended = p.solution.slice(0, 5).concat([h.next]);
      expect(checkZipPath(toZipPublic(p), extended, false).ok).toBe(true);
    }
    const wrong = p.solution.slice(0, 5).concat([p.solution[1]]);
    expect(zipHint(p, { path: wrong })).toEqual({ keep: 5 });
    expect(zipHint(p, { path: p.solution })).toEqual({ done: true });
  });

  it("generates within a reasonable time", () => {
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) generateZip(new Rng(`time-${i}`));
    expect(Date.now() - t0).toBeLessThan(5000);
  });
});
