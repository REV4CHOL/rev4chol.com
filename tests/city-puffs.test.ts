import { describe, expect, it } from 'vitest';
import { BEACON, beaconAlpha, glowSet, puffAdvance, puffPose, PUFF_RATE, STACK, VENT } from '../src/about/city-puffs';
import { planCity } from '../src/about/city-plan';
import { hashSlug } from '../src/project/dossier';

const plan = planCity(hashSlug('revachol-night-city'));

describe('The glows (owner: a weak PC stuttered — a thousand smoke and steam sprites were a thousand draw calls)', () => {
  it('lists six puffs a stack, three a vent, every beacon: 1,011 and 42 for the plan', () => {
    const g = glowSet(plan.stacks, plan.vents, plan.beacons);
    expect(g.puffs.length).toBe(plan.stacks.length * 6 + plan.vents.length * 3);
    expect(g.puffs.length).toBe(1011);
    expect(g.beacons.length).toBe(42);
    const s = glowSet([{ x: 1, z: 2, top: 30 }], [{ x: 5, z: 6 }], []);
    expect(s.puffs.length).toBe(9);
    expect(s.puffs[0]).toMatchObject({ x: 1, y0: 30.5, z: 2, rise: STACK.rise, drift: STACK.drift, base: STACK.base, tint: STACK.tint, t: 0 });
    expect(s.puffs[6]).toMatchObject({ x: 5, y0: 0.4, z: 6, rise: VENT.rise, tint: VENT.tint, t: 0 });
    expect(s.puffs.slice(0, 6).map((p) => p.t)).toEqual([0, 1, 2, 3, 4, 5].map((i) => i / 6));
  });
  it('a puff drifts and rises, grows from 0.6 to 2.8 of its base and fades from 0.22 to nothing', () => {
    const p = { x: 10, y0: 20, z: 30, rise: 26, drift: 9, base: 5, tint: '#8a8fa8', t: 0 };
    expect(puffPose(p, 0)).toEqual({ x: 10, y: 20, z: 30, size: 3, alpha: 0.22 });
    const end = puffPose(p, 1);
    expect(end.x).toBe(19); expect(end.y).toBe(46); expect(end.size).toBeCloseTo(14, 9); expect(end.alpha).toBe(0);
    expect(puffAdvance(0.5)).toBeCloseTo(0.5 + PUFF_RATE, 9);
    expect(puffAdvance(0.999)).toBeLessThan(0.01);
  });
  it('a beacon burns sixteen ticks and rests sixteen, its neighbour the other way round', () => {
    expect(beaconAlpha(0, 0)).toBe(0.12); expect(beaconAlpha(16, 0)).toBe(0.95); expect(beaconAlpha(32, 0)).toBe(0.12);
    expect(beaconAlpha(0, 1)).toBe(0.95);
    expect(BEACON.size).toBe(3.2);
  });
});
