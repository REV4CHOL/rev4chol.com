/** THE GLOWS (owner: a weak PC stuttered): the smoke over the stacks, the steam from the vents and the towers' beacons
 *  were a thousand sprites — a draw call and a material each — for a fifth of the frame's CPU. They are one instanced
 *  mesh of billboards now (city3d.ts); this is their set and their cycle, pure. */
export const PUFF_RATE = 0.006;
export const STACK_PUFFS = 6, VENT_PUFFS = 3;
export const STACK = { rise: 26, drift: 9, base: 5, tint: '#8a8fa8' };
export const VENT = { rise: 7, drift: 1.2, base: 1.6, tint: '#c8d0e8' };
export const BEACON = { size: 3.2, tint: '#FF2E63' };
export interface Puff { x: number; y0: number; z: number; rise: number; drift: number; base: number; tint: string; t: number }
/** Six puffs a stack from its top, three a vent from the ground, phased along the cycle; the beacons as they are. */
export function glowSet(stacks: { x: number; z: number; top: number }[], vents: { x: number; z: number }[], beacons: { x: number; y: number; z: number }[]): { puffs: Puff[]; beacons: { x: number; y: number; z: number }[] } {
  const puffs: Puff[] = [];
  for (const s of stacks) for (let i = 0; i < STACK_PUFFS; i++) puffs.push({ x: s.x, y0: s.top + 0.5, z: s.z, ...STACK, t: i / STACK_PUFFS });
  for (const v of vents) for (let i = 0; i < VENT_PUFFS; i++) puffs.push({ x: v.x, y0: 0.4, z: v.z, ...VENT, t: i / VENT_PUFFS });
  return { puffs, beacons: beacons.map((b) => ({ x: b.x, y: b.y, z: b.z })) };
}
/** Where a puff is at `t` of its cycle, how big and how faint. */
export function puffPose(p: Puff, t: number): { x: number; y: number; z: number; size: number; alpha: number } {
  return { x: p.x + p.drift * t, y: p.y0 + p.rise * t, z: p.z, size: p.base * (0.6 + t * 2.2), alpha: 0.22 * (1 - t) };
}
export const puffAdvance = (t: number): number => (t + PUFF_RATE) % 1;
/** A beacon's light at `tick`: sixteen ticks on, sixteen off, the i-th a phase apart. */
export const beaconAlpha = (tick: number, i: number): number => (((tick >> 4) + i) % 2 ? 0.95 : 0.12);
