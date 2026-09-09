/** THE WORLD'S CLOCK (owner: on a phone the city moved in slow motion and lagged; a 120 Hz desktop ran it at twice
 *  its speed): the sims step at 60 Hz by an ACCUMULATOR of real time — a frame runs as many steps as the time owed
 *  allows, at most three (a hitch or a hidden tab never snowballs: what is owed past three steps is forgiven), and at
 *  most what the last steps' cost allows: a step over 9 ms allows one a frame, over 5 ms two, else three — a slow
 *  phone runs the sims at real time when its CPU can and degrades gracefully when it cannot. The camera rigs are not
 *  stepped: they advance by the frame's real time (frameScale). Pure, tested. */
export const STEP = 1000 / 60;
export const MAX_STEPS = 3;

/** The time owed after a frame of `dt` ms on top of `acc`: never more than three steps' worth. */
export function owed(acc: number, dt: number): number {
  return Math.min(Math.max(0, acc) + Math.max(0, dt), STEP * MAX_STEPS);
}

/** How many steps a frame runs: what `acc` owes (whole steps), at most three, at most what a step's `cost` (ms)
 *  allows — over 9 ms one, over 5 ms two, else three. */
export function stepsAllowed(acc: number, cost: number): number {
  const cap = cost > 9 ? 1 : cost > 5 ? 2 : MAX_STEPS;
  return Math.max(0, Math.min(Math.floor(acc / STEP + 1e-9), cap));
}

/** The camera rigs' advance for a frame of `dt` ms, in steps: dt / 16.67, capped at three (a stall does not fling the eye). */
export function frameScale(dt: number): number {
  return Math.min(MAX_STEPS, Math.max(0, dt) / STEP);
}

/** A buffer a sim writes for the GPU, shown between its last two states (owner: every lane jittered — on a 120 Hz
 *  desktop the 60 Hz step landed on alternate frames against a camera that glides every frame). */
export interface Mover {
  /** The array the sim writes and the GPU reads. */
  arr: Float32Array;
  /** The last two states the sim wrote, and the steps they were written at. */
  prev: Float32Array; cur: Float32Array; prevStep: number; curStep: number;
  /** Floats an item, and where the item's translation sits in it (12 in a matrix, 0 in a point). */
  stride: number; at: number;
  /** A translation jump past this snaps the item to `cur`: a respawn, a portal, a relaunch. */
  snap: number;
}
export function newMover(arr: Float32Array, stride: number, snap: number): Mover {
  return { arr, prev: Float32Array.from(arr), cur: Float32Array.from(arr), prevStep: 0, curStep: 0, stride, at: stride === 16 ? 12 : 0, snap };
}
/** After a sim wrote `arr` at `step`: the states roll (the buffers swap; one copy). */
export function rollMover(m: Mover, step: number): void {
  const p = m.prev; m.prev = m.cur; m.cur = p; m.cur.set(m.arr);
  m.prevStep = m.curStep; m.curStep = step;
}
/** The render's time in steps: the steps run plus the fraction owed. */
export const renderTime = (tick: number, acc: number): number => tick + Math.min(1, Math.max(0, acc / STEP));
/** Writes `arr` at time `T`: every item between `prev` and `cur` by the mover's own cadence (a buffer written every
 *  other step blends over two), snapped to `cur` when its translation jumped. Returns the blend used. */
export function blendMover(m: Mover, T: number): number {
  const gap = Math.max(1, m.curStep - m.prevStep);
  const a = Math.min(1, Math.max(0, (T - m.curStep) / gap));
  const { arr, prev, cur, stride, at } = m, s2 = m.snap * m.snap;
  for (let i = 0; i < arr.length; i += stride) {
    const dx = cur[i + at] - prev[i + at], dy = cur[i + at + 1] - prev[i + at + 1], dz = cur[i + at + 2] - prev[i + at + 2];
    if (dx * dx + dy * dy + dz * dz > s2) for (let k = 0; k < stride; k++) arr[i + k] = cur[i + k];
    else for (let k = 0; k < stride; k++) arr[i + k] = prev[i + k] + (cur[i + k] - prev[i + k]) * a;
  }
  return a;
}
