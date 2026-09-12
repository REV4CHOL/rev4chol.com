import { describe, expect, it } from 'vitest';
import { PAINT } from '../src/about/city-paint';

// The ladder: polygonOffsetUnits for every flat paint — greater is pushed behind, lesser pulled in
// front. Parallel planes centimetres apart tie in a 24-bit depth buffer a few hundred metres out
// (near 0.5: the smallest step it can tell is ~d²/(0.5·2²⁴), 4 cm at 600 m), so the rung, not the
// height, must name the winner — with margin for per-triangle rounding, two quanta or more.
describe('the paint ladder', () => {
  it('pushes the ground behind every paint, the patches between the ground and the strips', () => {
    expect(PAINT.ground).toBeGreaterThan(0);
    expect(PAINT.patch).toBeGreaterThan(0);
    expect(PAINT.ground - PAINT.patch).toBeGreaterThanOrEqual(2);
    for (const [name, units] of Object.entries(PAINT)) {
      if (name === 'ground' || name === 'patch') continue;
      expect(PAINT.patch - units, `${name} in front of the patches`).toBeGreaterThanOrEqual(2);
    }
  });

  it('descends as the paint stacks: roads, lanes, the boulevard, the arterial, the boxes', () => {
    const stack = [PAINT.roadX, PAINT.roadZ, PAINT.laneX, PAINT.laneZ, PAINT.boulevard, PAINT.arterial, PAINT.junction];
    for (let i = 1; i < stack.length; i++) expect(stack[i]).toBeLessThan(stack[i - 1]);
  });

  it('keeps the crossing paint clear of the deepest box rung by two, and the decals clear of everything', () => {
    const deepestBox = PAINT.junction - 2; // three rungs, a street each
    expect(PAINT.zebra).toBeLessThanOrEqual(deepestBox - 2);
    expect(PAINT.stop).toBeLessThanOrEqual(deepestBox - 2);
    const deepestOpaque = Math.min(PAINT.zebra, PAINT.stop);
    expect(PAINT.decal).toBeLessThanOrEqual(deepestOpaque - 2);
  });
});
