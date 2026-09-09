import { describe, expect, it } from 'vitest';
import { fov24, LensPass } from '../src/about/city-post';

type Defined = { mat: { defines: Record<string, number>; fragmentShader: string } };

describe("A phone's lens (owner: mobile is very laggy — three full-screen passes at the phone's pixels)", () => {
  it('compiles without its four softness fetches when cheap, with them by default', () => {
    const cheap = new LensPass({ cheap: true }) as unknown as Defined, full = new LensPass() as unknown as Defined;
    expect(cheap.mat.defines.SOFT).toBe(0);
    expect(full.mat.defines.SOFT).toBe(1);
    expect(full.mat.fragmentShader).toContain('#if SOFT');
  });
  it('a 24mm across the long edge', () => {
    expect(fov24(16 / 9)).toBeCloseTo((2 * Math.atan(Math.tan(Math.atan(18 / 24)) / (16 / 9)) * 180) / Math.PI, 6);
    expect(fov24(0.5)).toBeCloseTo((2 * Math.atan(18 / 24) * 180) / Math.PI, 6);
  });
});
