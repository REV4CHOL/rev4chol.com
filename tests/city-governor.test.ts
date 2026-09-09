import { describe, expect, it } from 'vitest';
import { BUSY, FAST, newGovernor, PHONE, SLOW, startTier, steer, TIERS } from '../src/about/city-governor';

describe("The governor (owner: other people's PCs stutter; the phone lags)", () => {
  it('opens at high on a desktop, mid on a phone or a small device, low on a starved connection — a fast connection never promotes', () => {
    expect(startTier({}, false)).toBe(2);
    expect(startTier({ connection: { downlink: 50, effectiveType: '4g' } }, false)).toBe(2);
    expect(startTier({}, true)).toBe(1);
    expect(startTier({ hardwareConcurrency: 2 }, false)).toBe(1);
    expect(startTier({ deviceMemory: 2 }, false)).toBe(1);
    expect(startTier({ connection: { effectiveType: '3g' } }, false)).toBe(1);
    expect(startTier({ connection: { saveData: true } }, false)).toBe(0);
    expect(startTier({ connection: { effectiveType: '2g' } }, true)).toBe(0);
  });
  it('the tiers: lights and the far rings grow with the tier; a phone takes 20 and 40', () => {
    expect(TIERS.map((t) => t.label)).toEqual(['low', 'mid', 'high', 'ultra']);
    expect(TIERS.map((t) => t.lights)).toEqual([0, 8, 14, 18]);
    expect(TIERS.map((t) => t.lod)).toEqual([[24, 40], [24, 40], [12, 24], [12, 24]]);
    expect(TIERS.map((t) => t.pix)).toEqual([3, 2, 1, 1]);
    expect(TIERS.map((t) => t.shadows)).toEqual([false, false, true, true]);
    expect(PHONE.lod).toEqual([20, 40]); expect(PHONE.lights).toEqual([0, 4]); expect(PHONE.floor).toBe(0.6);
  });
  it('long frames shrink the scale by a fifth to the floor, then step the tier down and close it; the first seconds hold', () => {
    const g = newGovernor(2, 0);
    expect(steer(g, 30, 20, 1000)).toBe(null);
    expect(steer(g, 30, 20, 3000)).toBe('scale-down'); expect(g.scale).toBeCloseTo(0.8, 9);
    expect(steer(g, 30, 20, 4000), 'the cooldown').toBe(null);
    expect(steer(g, 30, 20, 5000)).toBe('scale-down'); expect(g.scale).toBeCloseTo(0.64, 9);
    expect(steer(g, 30, 20, 7000)).toBe('scale-down'); expect(g.scale).toBe(0.6);
    expect(steer(g, 30, 20, 9000)).toBe('down'); expect(g.tier).toBe(1); expect(g.scale).toBe(1); expect(g.ceiling).toBe(1);
    expect(steer(g, 30, 20, 12000), 'four seconds after a tier down').toBe(null);
    expect(steer(g, 30, 20, 13000)).toBe('scale-down');
    expect(steer(g, SLOW, 20, 15000), 'at the line it holds').toBe(null);
  });
  it('short frames with headroom, twelve seconds after the last step down, grow the scale back and then the tier — never past the ceiling', () => {
    const g = newGovernor(2, 0);
    steer(g, 30, 20, 3000); steer(g, 30, 20, 5000); steer(g, 30, 20, 7000); steer(g, 30, 20, 9000); // to mid, closed
    expect(g.ceiling).toBe(1);
    expect(steer(g, 16, 5, 15000), 'too soon after the step down').toBe(null);
    expect(steer(g, 16, 5, 21100), 'the scale is whole and the tier at its ceiling').toBe(null);
    expect(steer(g, 30, 20, 21200)).toBe('scale-down');
    expect(steer(g, 16, 5, 23300), 'twelve seconds since the last shrink have not passed').toBe(null);
    expect(steer(g, 16, 5, 33300)).toBe('scale-up'); expect(g.scale).toBeCloseTo(0.92, 9);
    expect(steer(g, 16, 5, 35400)).toBe('scale-up'); expect(g.scale).toBe(1);
    expect(steer(g, 16, 5, 37500), 'the ceiling').toBe(null);
    const h = newGovernor(1, 0);
    expect(steer(h, 16, 5, 13000)).toBe('up'); expect(h.tier).toBe(2);
    expect(steer(h, 16, BUSY, 16000), 'no headroom on the CPU').toBe(null);
    expect(steer(h, FAST, 5, 16000), 'at the line it holds').toBe(null);
    expect(steer(h, 16, 5, 16000)).toBe('up'); expect(h.tier).toBe(3);
  });
  it('a phone keeps its floor', () => {
    const g = newGovernor(1, 0, PHONE.floor);
    for (let t = 3000; t < 20000; t += 2100) steer(g, 40, 30, t);
    expect(g.tier).toBe(0); expect(g.scale).toBeGreaterThanOrEqual(0.6);
  });
});
