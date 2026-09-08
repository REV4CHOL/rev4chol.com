import { describe, expect, it } from 'vitest';
import { frameScale, MAX_STEPS, owed, STEP, stepsAllowed } from '../src/about/city-clock';

/** Runs `frames` frames of `dt` ms with a step costing `cost` ms; returns the steps run. */
const run = (frames: number, dt: number, cost: number) => {
  let acc = 0, steps = 0;
  for (let i = 0; i < frames; i++) { acc = owed(acc, dt); const n = stepsAllowed(acc, cost); steps += n; acc -= n * STEP; }
  return steps;
};

describe("The world's clock (owner: slow motion on a phone; a 120 Hz desktop ran the city at twice its speed)", () => {
  it('steps at 60 Hz whatever the frame rate: one a frame at 60, one every other at 120, two a frame at 30', () => {
    expect(STEP).toBeCloseTo(16.667, 2);
    expect(run(600, 1000 / 60, 2)).toBe(600);
    expect(run(1200, 1000 / 120, 2)).toBe(600);
    expect(run(300, 1000 / 30, 2)).toBe(600);
    expect(run(240, 1000 / 24, 2)).toBeGreaterThanOrEqual(598); expect(run(240, 1000 / 24, 2)).toBeLessThanOrEqual(600);
  });
  it('degrades by the cost of a step: over 9 ms one a frame, over 5 ms two, else three; never more than three', () => {
    expect(stepsAllowed(STEP * 3, 2)).toBe(3);
    expect(stepsAllowed(STEP * 3, 6)).toBe(2);
    expect(stepsAllowed(STEP * 3, 12)).toBe(1);
    expect(stepsAllowed(STEP * 10, 2)).toBe(MAX_STEPS);
    expect(stepsAllowed(STEP * 0.99, 2)).toBe(0);
    expect(stepsAllowed(0, 2)).toBe(0);
    expect(run(300, 1000 / 30, 12), 'a slow phone at 30 fps runs half speed, not slow motion by the frame').toBe(300);
    expect(run(300, 1000 / 30, 7)).toBe(600);
  });
  it('forgives a stall: a hidden second owes three steps, not sixty', () => {
    expect(owed(0, 1000)).toBe(STEP * MAX_STEPS);
    expect(owed(STEP * 2.5, 5)).toBeCloseTo(STEP * 2.5 + 5, 9);
    expect(owed(-3, -3)).toBe(0);
    let acc = owed(0, 1000);
    const n = stepsAllowed(acc, 2); acc -= n * STEP;
    expect(n).toBe(3); expect(acc).toBeCloseTo(0, 9);
  });
  it('advances the rigs by real time, capped at three steps', () => {
    expect(frameScale(1000 / 60)).toBeCloseTo(1, 9);
    expect(frameScale(1000 / 120)).toBeCloseTo(0.5, 9);
    expect(frameScale(1000 / 30)).toBeCloseTo(2, 9);
    expect(frameScale(2000)).toBe(3);
    expect(frameScale(-1)).toBe(0);
  });
});
