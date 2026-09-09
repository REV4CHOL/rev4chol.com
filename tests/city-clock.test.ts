import { describe, expect, it } from 'vitest';
import { blendMover, frameScale, MAX_STEPS, newMover, owed, renderTime, rollMover, STEP, stepsAllowed } from '../src/about/city-clock';

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

describe('The render between the steps (owner: every lane jittered — a 120 Hz desktop stepped the sims on alternate frames)', () => {
  /** A point the sim moves one unit a step (every `cadence` steps), rendered by a stream of frames of `dts` ms: the rendered x each frame, the steps each frame. */
  const stream = (dts: number[], cadence = 1) => {
    const arr = new Float32Array(3), m = newMover(arr, 3, 5);
    let acc = 0, tick = 0;
    const xs: number[] = [], steps: number[] = [];
    for (const dt of dts) {
      acc = owed(acc, dt);
      const n = stepsAllowed(acc, 2);
      for (let i = 0; i < n; i++) { tick += 1; if (tick % cadence === 0) { arr[0] = tick; rollMover(m, tick); } }
      acc -= n * STEP;
      blendMover(m, renderTime(tick, acc));
      xs.push(arr[0]); steps.push(n);
    }
    return { xs, steps };
  };
  const deltas = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]);
  it('at 120 Hz the sims step on alternate frames and the render advances half a step every frame', () => {
    const { xs, steps } = stream(new Array(240).fill(1000 / 120));
    expect(steps.filter((n) => n === 0).length).toBeGreaterThan(100);
    const d = deltas(xs).slice(4);
    expect(Math.min(...d)).toBeGreaterThan(0.45);
    expect(Math.max(...d)).toBeLessThan(0.55);
  });
  it('a jittered 60 Hz (16.2 / 17.1 ms) advances within a tenth of a step a frame', () => {
    const { xs } = stream(new Array(120).fill(0).map((_, i) => (i % 2 ? 17.1 : 16.2)));
    const d = deltas(xs).slice(4);
    expect(Math.min(...d)).toBeGreaterThan(0.9);
    expect(Math.max(...d)).toBeLessThan(1.1);
  });
  it('a buffer written every other step blends over two', () => {
    const { xs } = stream(new Array(60).fill(1000 / 60), 2);
    const d = deltas(xs).slice(6);
    expect(Math.min(...d)).toBeGreaterThan(0.9);
    expect(Math.max(...d)).toBeLessThan(1.1);
  });
  it('a jump past the snap goes straight to the new place; a stopped item stays; a matrix blends whole', () => {
    const arr = new Float32Array(32), m = newMover(arr, 16, 5);
    arr.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 0, 0, 1], 0); arr.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 7, 0, 0, 1], 16);
    rollMover(m, 1);
    arr[12] = 300; arr[28] = 7; arr[0] = 2;
    rollMover(m, 2);
    expect(blendMover(m, 2.5)).toBeCloseTo(0.5, 9);
    expect(arr[12]).toBe(300);
    expect(arr[0]).toBe(2);
    expect(arr[28]).toBe(7);
    arr[12] = 302; rollMover(m, 3); blendMover(m, 3.25);
    expect(arr[12]).toBeCloseTo(300.5, 6);
    expect(arr[0]).toBe(2);
  });
  it('the first frames show the start', () => {
    const arr = new Float32Array([4, 5, 6]), m = newMover(arr, 3, 5);
    blendMover(m, 0.7);
    expect(Array.from(arr)).toEqual([4, 5, 6]);
    expect(renderTime(3, STEP * 0.25)).toBeCloseTo(3.25, 9);
    expect(renderTime(3, STEP * 4)).toBe(4);
  });
});
