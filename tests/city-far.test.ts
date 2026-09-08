import { describe, expect, it } from 'vitest';
import { farMasses, farRingTiles, mergeBoxes, TILE_WINDOWS, WINDOW_ALONG, WINDOW_UP } from '../src/about/city-far';
import { LANDMARK_ARCH, planCity, TILE_P } from '../src/about/city-plan';
import { mulberry32 } from '../src/lib/rng';
import { hashSlug } from '../src/project/dossier';

const plan = planCity(hashSlug('revachol-night-city'));

describe('The far LOD (owner: the whole city on the far horizon, from any height; always in view)', () => {
  it('rings the far tiles as city-plan does: rings 3–7 are two hundred tiles to 5,985', () => {
    const far = farRingTiles(3, 7);
    expect(far.length).toBe(200);
    expect(far.every((t) => t.ring >= 3 && t.ring <= 7)).toBe(true);
    expect(Math.max(...far.map((t) => Math.max(Math.abs(t.dx), Math.abs(t.dz)))) + TILE_P / 2).toBe(5985);
    expect(farRingTiles(2, 4).length).toBe(16 + 24 + 32);
  });
  it('takes the tall masses alone — facades and cylinders, no landmark, nothing turned — twelve and more high near, twenty-four far', () => {
    const all = [...plan.core, ...plan.outer, ...plan.filler];
    const near = farMasses(all, 12), far = farMasses(all, 24);
    expect(near.length).toBeGreaterThan(400);
    expect(far.length).toBeGreaterThan(100);
    expect(far.length).toBeLessThan(near.length);
    expect(near.every((b) => b.h >= 12) && far.every((b) => b.h >= 24)).toBe(true);
    const tall = all.filter((s) => s.h >= 12);
    const landmarks = tall.filter((s) => LANDMARK_ARCH.has(s.arch)).length, turned = tall.filter((s) => s.rotY).length, other = tall.filter((s) => s.kind !== 'facade' && s.kind !== 'cyl').length;
    expect(landmarks + other, 'something to leave out').toBeGreaterThan(0);
    expect(near.length + landmarks + turned + other).toBeGreaterThanOrEqual(tall.length);
    expect(near.some((b) => Math.abs(b.x) > 300 || Math.abs(b.z) > 300), 'the outer ring too').toBe(true);
    expect(near.length).toBeGreaterThan(farMasses([...plan.core, ...plan.outer], 12).length); // the filler counts
  });
  it('merges boxes into walls and roofs: twenty vertices and thirty indices a box, walls then roofs, outward faces, window UVs, a tint a box', () => {
    const boxes = [{ x: 10, y: 16, z: -5, w: 24, h: 32, d: 12 }, { x: -40, y: 6, z: 30, w: 8, h: 12, d: 8 }];
    const m = mergeBoxes(boxes, mulberry32(3));
    expect(m.position.length).toBe(2 * 20 * 3); expect(m.uv.length).toBe(2 * 20 * 2); expect(m.color.length).toBe(2 * 20 * 3); expect(m.index.length).toBe(60);
    expect(m.groups).toEqual([{ start: 0, count: 48, materialIndex: 0 }, { start: 48, count: 12, materialIndex: 1 }]);
    const P = (k: number) => [m.position[k * 3], m.position[k * 3 + 1], m.position[k * 3 + 2]];
    for (let t = 0; t < 20; t++) { // every triangle winds counter-clockwise about its declared normal
      const a = P(m.index[t * 3]), b = P(m.index[t * 3 + 1]), c = P(m.index[t * 3 + 2]);
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const k = m.index[t * 3];
      const dot = n[0] * m.normal[k * 3] + n[1] * m.normal[k * 3 + 1] + n[2] * m.normal[k * 3 + 2];
      expect(dot, `triangle ${t}`).toBeGreaterThan(0);
      expect(t < 16 ? m.normal[k * 3 + 1] : 1, 'a wall is upright, a roof faces up').toBe(t < 16 ? 0 : 1);
    }
    for (let v = 0; v < 40; v++) { // every vertex on its box's surface, inside its bounds
      const b = boxes[v < 16 ? 0 : v < 32 ? 1 : v < 36 ? 0 : 1], p = P(v);
      expect(Math.abs(p[0] - b.x)).toBeLessThanOrEqual(b.w / 2 + 1e-6); expect(Math.abs(p[2] - b.z)).toBeLessThanOrEqual(b.d / 2 + 1e-6);
      expect(p[1]).toBeGreaterThanOrEqual(b.y - b.h / 2 - 1e-6); expect(p[1]).toBeLessThanOrEqual(b.y + b.h / 2 + 1e-6);
    }
    // the front wall's UVs span the wall's width and height in window tiles, from a whole-window phase
    const u = (v: number) => m.uv[v * 2], w = (v: number) => m.uv[v * 2 + 1];
    expect(u(1) - u(0)).toBeCloseTo(24 / (WINDOW_ALONG * TILE_WINDOWS), 6); expect(w(2) - w(1)).toBeCloseTo(32 / (WINDOW_UP * TILE_WINDOWS), 6);
    expect(u(9) - u(8)).toBeCloseTo(12 / (WINDOW_ALONG * TILE_WINDOWS), 6); // the side wall: the depth
    expect((u(0) * TILE_WINDOWS) % 1).toBeCloseTo(0, 6); expect((w(0) * TILE_WINDOWS) % 1).toBeCloseTo(0, 6);
    for (let v = 1; v < 16; v++) expect(m.color[v * 3]).toBe(m.color[0]); // one tint over a box's walls
    expect(m.color[16 * 3] !== m.color[0] || m.color[16 * 3 + 2] !== m.color[2], 'the boxes differ').toBe(true);
    expect(mergeBoxes([], mulberry32(1)).index.length).toBe(0);
  });
});
