import { describe, expect, it } from 'vitest';
import { planCity } from '../src/about/city-plan';
import { Runners, roofGap } from '../src/about/city-runners';
import { mulberry32 } from '../src/lib/rng';
import { hashSlug } from '../src/project/dossier';

const plan = planCity(hashSlug('revachol-night-city'));

describe('Runners', () => {
  it('keeps every runner on a roof or on an arc between two, never in a solid, and makes them fly — for 6000 frames', () => {
    const sim = new Runners(plan.roofs, plan.grid, mulberry32(7), 60);
    expect(sim.runners.length).toBe(60);
    let leaps = 0, thrusts = 0, rockets = 0, checked = 0;
    const seen = new Set<string>();
    for (let f = 0; f < 6000; f++) {
      sim.step();
      for (const r of sim.runners) {
        seen.add(r.act);
        if (f % 25 !== 0) continue;
        checked += 1;
        expect(Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.z)).toBe(true);
        if (r.act === 'dance' || r.act === 'run' || r.act === 'land') { // on the roof, at its height
          expect(Math.abs(r.x - r.roof.x)).toBeLessThanOrEqual(r.roof.w / 2 + 0.01);
          expect(Math.abs(r.z - r.roof.z)).toBeLessThanOrEqual(r.roof.d / 2 + 0.01);
          expect(Math.abs(r.y - r.roof.top)).toBeLessThan(0.3);
        } else { // on an arc: above the city's solids, bound for a roof the flight can reach
          expect(r.to).not.toBeNull();
          if (r.act === 'leap') { leaps += 1; expect(roofGap(r.roof, r.to!)).toBeLessThanOrEqual(12.01); }
          if (r.act === 'thrust') thrusts += 1;
          if (r.act === 'rocket') rockets += 1;
          if (r.t > 2 && r.t < r.T - 2) expect(plan.grid.hit(r.x, r.y + 0.8, r.z, 0.3), `a runner inside a solid at ${r.x.toFixed(1)},${r.y.toFixed(1)},${r.z.toFixed(1)} (${r.act})`).toBeNull();
        }
      }
    }
    expect(checked).toBeGreaterThan(10000);
    for (const a of ['dance', 'run', 'leap', 'thrust', 'rocket', 'land']) expect(seen.has(a), a).toBe(true);
    expect(leaps).toBeGreaterThan(20);
    expect(thrusts).toBeGreaterThan(10);
    expect(rockets).toBeGreaterThan(0);
    expect(sim.rockets).toBeGreaterThan(0);
  }, 120000);

  it('is deterministic for a seed', () => {
    const a = new Runners(plan.roofs, plan.grid, mulberry32(3), 20), b = new Runners(plan.roofs, plan.grid, mulberry32(3), 20);
    for (let f = 0; f < 800; f++) { a.step(); b.step(); }
    expect(a.runners.map((r) => [r.x, r.y, r.z, r.act])).toEqual(b.runners.map((r) => [r.x, r.y, r.z, r.act]));
  });
});
