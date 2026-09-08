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

  it('runs a hundred and fifty (owner: massively more runners, then down to a hundred and fifty) cheaply: under two milliseconds a frame, every one on a roof or an arc', () => {
    const sim = new Runners(plan.roofs, plan.grid, mulberry32(11), 150);
    expect(sim.runners.length).toBe(150);
    for (let f = 0; f < 300; f++) sim.step(); // warm up: the first flights planned
    const t0 = performance.now();
    for (let f = 0; f < 600; f++) sim.step();
    const perFrame = (performance.now() - t0) / 600;
    expect(perFrame).toBeLessThan(2);
    for (const r of sim.runners) expect(Number.isFinite(r.x + r.y + r.z)).toBe(true);
    expect(sim.runners.filter((r) => r.act === 'thrust' || r.act === 'rocket' || r.act === 'leap').length).toBeGreaterThan(5); // a crowd in the air at any moment
    expect(sim.runners.filter((r) => r.act !== 'dance').length, 'most of them on the move (owner: no idle crowds on the roofs)').toBeGreaterThan(60);
  });

  it("jumps at a runner's pace, not a flea's (owner: fewer jumps, slower; then half the pace, especially in flight): a flight every eight to twenty seconds a runner, on a roof more than in the air", () => {
    const sim = new Runners(plan.roofs, plan.grid, mulberry32(5), 60);
    const was = sim.runners.map((r) => r.act);
    const flying = (a: string) => a === 'leap' || a === 'thrust' || a === 'rocket';
    let takeoffs = 0, air = 0, dancing = 0, samples = 0;
    for (let f = 0; f < 6000; f++) {
      sim.step();
      sim.runners.forEach((r, i) => { if (flying(r.act) && !flying(was[i])) takeoffs += 1; was[i] = r.act; });
      if (f >= 1200) { samples += 1; air += sim.runners.filter((r) => flying(r.act)).length; dancing += sim.runners.filter((r) => r.act === 'dance').length; }
    }
    const perRunnerMinute = takeoffs / 60 / (6000 / 3600); // take-offs a runner a minute, at sixty frames a second
    console.log(`runners: ${perRunnerMinute.toFixed(1)} take-offs a runner a minute; in the air ${(air / samples / 60 * 100).toFixed(0)} %, dancing ${(dancing / samples / 60 * 100).toFixed(0) } %`);
    expect(perRunnerMinute, 'a flight every eight to twenty seconds').toBeGreaterThan(3);
    expect(perRunnerMinute, 'a flight every eight to twenty seconds').toBeLessThan(8);
    expect(air / samples / 60, 'on a roof more than in the air').toBeLessThan(0.5); // (the flights last twice what they did at the owner's half pace: a rocket crosses the city in ten to twenty seconds)
    expect(dancing / samples / 60, 'and not idling there (owner: no idle crowds on the roofs)').toBeLessThan(0.45);
  }, 60000);

  it('is deterministic for a seed', () => {
    const a = new Runners(plan.roofs, plan.grid, mulberry32(3), 20), b = new Runners(plan.roofs, plan.grid, mulberry32(3), 20);
    for (let f = 0; f < 800; f++) { a.step(); b.step(); }
    expect(a.runners.map((r) => [r.x, r.y, r.z, r.act])).toEqual(b.runners.map((r) => [r.x, r.y, r.z, r.act]));
  });
});
