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
