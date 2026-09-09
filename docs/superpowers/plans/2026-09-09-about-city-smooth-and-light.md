# The city, smooth and light — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the sims between their fixed steps (no jitter at any refresh rate), draw the thousand smoke and beacon sprites as one mesh, and steer a render scale and leaner tiers by the measured frame — for the owner's three points (spec: `docs/superpowers/specs/2026-09-09-about-city-smooth-and-light-design.md`).

**Architecture:** Three pure modules carry the logic and the tests — `city-clock.ts` (movers: roll and blend), `city-puffs.ts` (the glows' cycle and set), `city-governor.ts` (the tiers table, the opening tier, the steering) — and `city3d.ts` wires them: a movers registry rolled by the drivers and blended in `render()`, one billboarded `InstancedMesh` for the glows, the governor in the loop, the far LOD built at two densities and gated by tier, a phone's post chain in `city-post.ts`.

**Tech Stack:** Vite 7, TypeScript strict, three 0.185, vitest. Gates: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.

## Global Constraints

- Bash for reads and edits (cat, sed -n, grep; node -e or scratch `.mjs` scripts with an exact-match `rep()` that throws on a wrong count for multi-line edits; a Windows command is at most ~8 K chars).
- `about-old.html` is never touched. No plates behind chrome. Never real text on a sign. Calm stills idle motion, keeps the sims.
- Every material with its own `onBeforeCompile` sets `shader.uniforms.uBeyond = uBeyond` or renders black.
- A `let` used by `render()` is declared before the first `fit()` (TDZ at boot: the `fscale` lesson).
- Counts unchanged: desktop 2,647 cars / 3,800 walkers / 150 runners; phone 803 / 1,783 / 70. Ring 1 at every tier.

---

### Task 1: The movers (city-clock.ts)

**Files:**
- Modify: `src/about/city-clock.ts`
- Test: `tests/city-clock.test.ts`

**Interfaces:**
- Produces: `interface Mover { arr; prev; cur; prevStep; curStep; stride; at; snap }`, `newMover(arr: Float32Array, stride: number, snap: number): Mover`, `rollMover(m: Mover, step: number): void`, `renderTime(tick: number, acc: number): number`, `blendMover(m: Mover, T: number): number` (returns the blend used).

- [ ] **Step 1: Write the failing tests** (append to `tests/city-clock.test.ts`; add `blendMover, newMover, renderTime, rollMover` to the import)

```ts
describe('The render between the steps (owner: every lane jittered — a 120 Hz desktop stepped the sims on alternate frames)', () => {
  /** A point that the sim moves one unit a step, rendered by a stream of frames of `dts` ms: the rendered x each frame and the steps run each frame. */
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
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/city-clock.test.ts` → FAIL (`newMover` is not exported).

- [ ] **Step 3: Implement** (append to `src/about/city-clock.ts`)

```ts
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
```

- [ ] **Step 4: Run** — `npx vitest run tests/city-clock.test.ts` → PASS (9 tests).
- [ ] **Step 5: Commit** — `git add src/about/city-clock.ts tests/city-clock.test.ts && git commit -m "feat(about): the movers — a sim's buffer shown between its last two steps"`

---

### Task 2: The movers wired (city3d.ts)

**Files:**
- Modify: `src/about/city3d.ts` (the clock import; a registry near `let tick = 0`; registrations after each mover's mesh; rolls at the end of each driver; the blend in `render()`; `acc`/`stepCost` moved beside `tick`; `tick()` at `a = 1`)

**Interfaces:**
- Consumes: Task 1's `newMover`, `rollMover`, `blendMover`, `renderTime`.

- [ ] **Step 1: The registry and the clock's state beside `tick`** — replace `  let tick = 0;` with

```ts
  let tick = 0;
  let acc = 0, stepCost = 0; // the world's clock (city-clock.ts): what is owed, what a step cost — here, before the first fit() renders
  // THE MOVERS (owner: every lane jittered): every buffer a sim writes is shown between its last two steps (city-clock.ts)
  const movers: { m: Mover; attr: { needsUpdate: boolean } }[] = [];
  const mover = (arr: ArrayLike<number>, attr: { needsUpdate: boolean }, stride: number, snap: number): Mover => { const m = newMover(arr as Float32Array, stride, snap); movers.push({ m, attr }); return m; };
```
and delete the later `let acc = 0, stepCost = 0;` beside the loop. Import `Mover, blendMover, newMover, renderTime, rollMover` from `./city-clock`.

- [ ] **Step 2: Register and roll.** The drivers are declared before `tick`; they only run after it. Registrations go right before each driver (the meshes exist by then), rolls at the driver's end:

| driver | movers (stride, snap) | roll |
|---|---|---|
| `driveCars` | `carMesh.instanceMatrix` (16, 5), `throws.instanceMatrix` (16, 5), `heads.arr`/`heads.pts.geometry.getAttribute('position')` (3, 5), `tails` same, `hulls`/`cabins`/`cabinWin` `.instanceMatrix` (16, 5), `boatLights.arr`/`boatLights.g.getAttribute('position')` (3, 5) | after the boats' `needsUpdate` lines |
| `runTrains` | `cars3`, `glass3` (16, 5), `trainLights` (3, 5) | end |
| `runCabs` | `cabs` (16, 5) | end |
| `walkPeople` | `pPos` / `peopleGeo.getAttribute('aPos')` (3, 2) | end |
| `runRoofs` | `rPos` / `runnerGeo.getAttribute('aPos')` (3, 4), `runners.trail.pos` / `sparkGeo.getAttribute('position')` (3, 4) | end |
| `fly` | `birdArr` / `birdGeo.getAttribute('position')` (3, 8) | end |
| `cruiseCraft` | `craftArr` / `craftGeo.getAttribute('position')` (3, 20) | end |
| `flyAir` | `airBody`, `airCabin` (16, 8), `airLights` (3, 8) | end |

The roll: `for (const m of carMovers) rollMover(m, tick);` where `const carMovers = [mover(...), ...]` is declared just above the driver. Because `mover()` is declared beside `tick` (after the drivers' code), the registrations must be written as `let carMovers: Mover[]` filled lazily on the driver's first run: `if (!carMovers) carMovers = [...]` — or, simpler, declare the registry (`movers`, `mover`) near the top of `createCity` right after `const calm = reducedMotion();`, where every driver can reach it, and leave only `acc`/`stepCost` beside `tick`. Do the latter.

- [ ] **Step 3: The blend in `render()`** — after `sky.position.copy(camera.position);` insert

```ts
    const T = alpha === undefined ? renderTime(tick, acc) : tick + alpha;
    for (const { m, attr } of movers) { blendMover(m, T); attr.needsUpdate = true; }
    farTime.value = T / 60; // the far fleet's clock: the same time, not a per-step increment
```
with the signature `const render = (alpha?: number) => {`; delete `farTime.value += 1 / 60;` from `tickWorld`; the debug `tick: (n = 1) => { for (...) { tickWorld(); render(1); } }`.

- [ ] **Step 4: Gates** — `npx tsc --noEmit`; the pane: reload `about.html`, `rvlRide.tick(60)`, `rvlRide.probe().cars` unchanged, no console error; a screenshot at the tour's pose matches the previous look.
- [ ] **Step 5: Commit** — `git commit -am "feat(about): the sims shown between their steps — no jitter at 120 Hz"`

---

### Task 3: The glows' cycle (city-puffs.ts)

**Files:**
- Create: `src/about/city-puffs.ts`
- Test: `tests/city-puffs.test.ts`

**Interfaces:**
- Produces: `PUFF_RATE`, `STACK_PUFFS`, `VENT_PUFFS`, `STACK`, `VENT`, `BEACON`, `interface Puff { x; y0; z; rise; drift; base; tint; t }`, `glowSet(stacks, vents, beacons): { puffs: Puff[]; beacons: { x; y; z }[] }`, `puffPose(p, t)`, `puffAdvance(t)`, `beaconAlpha(tick, i)`.

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run tests/city-puffs.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** `src/about/city-puffs.ts`

```ts
/** THE GLOWS (owner: a weak PC stuttered): the smoke over the stacks, the steam from the vents and the towers' beacons
 *  were a thousand sprites — a draw call and a material each — for a fifth of the frame's CPU. They are one instanced
 *  mesh of billboards now; this is their cycle, pure. */
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
```

- [ ] **Step 4: Run** — PASS (3 tests).
- [ ] **Step 5: Commit** — `git add src/about/city-puffs.ts tests/city-puffs.test.ts && git commit -m "feat(about): the glows' cycle, pure"`

---

### Task 4: One mesh of glows (city3d.ts)

**Files:**
- Modify: `src/about/city3d.ts` — the beacons and puffs block (`const beacons: Sprite[] = []` … `breathe`), the beacons' blink in `tickWorld`.

- [ ] **Step 1: The billboard material** (a function beside `glowTexture`):

```ts
/** A glow as an instanced billboard: the instance's translation and scale kept, the quad laid across the view; the tint
 *  in the instance colour, the fade in `aAlpha` (owner: a thousand sprites were a thousand draw calls). */
function billboardMaterial(map: Texture): MeshBasicMaterial {
  const mat = new MeshBasicMaterial({ map, transparent: true, depthWrite: false });
  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uBeyond = uBeyond;
    shader.vertexShader = 'attribute float aAlpha;\nvarying float vAlpha;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;')
      .replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\nmvPosition.xy += transformed.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));\ngl_Position = projectionMatrix * mvPosition;');
    shader.fragmentShader = 'varying float vAlpha;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vAlpha;');
  };
  return mat;
}
```

- [ ] **Step 2: The mesh** — replace the beacons' and puffs' blocks with

```ts
  const glowSpecs = glowSet(plan.stacks, plan.vents, plan.beacons);
  const NPUFF = glowSpecs.puffs.length, NGLOW = NPUFF + glowSpecs.beacons.length;
  const glowGeo = new PlaneGeometry(1, 1);
  const glowAlpha = new InstancedBufferAttribute(new Float32Array(NGLOW), 1);
  glowGeo.setAttribute('aAlpha', glowAlpha);
  const glows = new InstancedMesh(glowGeo, billboardMaterial(glowTexture('#ffffff')), NGLOW);
  glows.frustumCulled = false;
  const glowTint = new Color();
  glowSpecs.puffs.forEach((p, i) => glows.setColorAt(i, glowTint.set(p.tint)));
  glowSpecs.beacons.forEach((b, i) => {
    dummy.rotation.set(0, 0, 0); dummy.position.set(b.x, b.y, b.z); dummy.scale.set(BEACON.size, BEACON.size, 1); dummy.updateMatrix();
    glows.setMatrixAt(NPUFF + i, dummy.matrix); glows.setColorAt(NPUFF + i, glowTint.set(BEACON.tint)); glowAlpha.array[NPUFF + i] = 0.12;
  });
  if (glows.instanceColor) glows.instanceColor.needsUpdate = true;
  scene.add(glows);
  const breathe = () => { // smoke over the stacks, steam from the vents: the puffs cycle upward (calm stills them)
    dummy.rotation.set(0, 0, 0);
    glowSpecs.puffs.forEach((p, i) => {
      p.t = puffAdvance(p.t);
      const q = puffPose(p, p.t);
      dummy.position.set(q.x, q.y, q.z); dummy.scale.set(q.size, q.size, 1); dummy.updateMatrix();
      glows.setMatrixAt(i, dummy.matrix); glowAlpha.array[i] = q.alpha;
    });
    glows.instanceMatrix.needsUpdate = true; glowAlpha.needsUpdate = true;
  };
```
and in `tickWorld` replace the beacons' loop with `for (let i = 0; i < glowSpecs.beacons.length; i++) glowAlpha.array[NPUFF + i] = beaconAlpha(tick, i);` followed by `glowAlpha.needsUpdate = true;`. Imports: `BEACON, beaconAlpha, glowSet, puffAdvance, puffPose` from `./city-puffs`; `InstancedBufferAttribute` and `Texture` from three if not yet imported. Remove the `Puff` interface, `puffMat`, `beacons`.

- [ ] **Step 3: Gates and the pane** — tsc; reload; `rvlRide.info().calls` at the tour's pose ~1,100 → ~110 (desktop 1280 × 720, `setQuality(2)`); warp to a stack (`plan.stacks[0]`: read `rvlRide.probe()` has none — use the pane: `warp(x, top + 10, z + 40, 0, -0.2)` for the first stack found by `scene()` traversal is not available; instead warp to a vent-rich street and screenshot) — the smoke reads as before; `tick(20)` twice and two screenshots: the beacons differ (blink).
- [ ] **Step 4: Commit** — `git commit -am "feat(about): the smoke, the steam and the beacons as one mesh — a thousand draw calls fewer"`

---

### Task 5: The governor (city-governor.ts)

**Files:**
- Create: `src/about/city-governor.ts`
- Test: `tests/city-governor.test.ts`

**Interfaces:**
- Produces: `interface Tier { label; far; fog; shadows; pix; lights; lod: [number, number] }`, `TIERS: Tier[]`, `PHONE = { lod: [20, 40], lights: [0, 4], floor: 0.6 }`, `startTier(dev: Device, mobile: boolean): number`, `interface Governor { tier; scale; ceiling; floor; until; lastChange; lastDown }`, `newGovernor(tier, now, floor?)`, `steer(g, avg, busy, now): Steer`, `SLOW = 20`, `FAST = 17.5`, `BUSY = 9`, `WINDOW = 90`.

- [ ] **Step 1: Write the failing tests**

```ts
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
    expect(steer(g, 16, 5, 15000), 'too soon').toBe(null);
    expect(steer(g, 16, 5, 21100)).toBe(null); // the scale is 1 already at mid; the tier is at its ceiling
    steer(g, 30, 20, 21200); // scale 0.8
    expect(steer(g, 16, 5, 23300)).toBe(null); // twelve seconds since the last step down have not passed? they have (9000) — but two since the change have not
    expect(steer(g, 16, 5, 23500)).toBe('scale-up'); expect(g.scale).toBeCloseTo(0.92, 9);
    expect(steer(g, 16, 5, 25600)).toBe('scale-up'); expect(g.scale).toBe(1);
    expect(steer(g, 16, 5, 27700), 'the ceiling').toBe(null);
    const h = newGovernor(1, 0);
    expect(steer(h, 16, 5, 13000)).toBe('up'); expect(h.tier).toBe(2);
    expect(steer(h, 16, BUSY, 16000), 'no headroom on the CPU').toBe(null);
    expect(steer(h, FAST, 5, 16000), 'at the line it holds').toBe(null);
  });
  it('a phone keeps its floor', () => {
    const g = newGovernor(1, 0, PHONE.floor);
    for (let t = 3000; t < 20000; t += 2100) steer(g, 40, 30, t);
    expect(g.tier).toBe(0); expect(g.scale).toBeGreaterThanOrEqual(0.6);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — module not found.

- [ ] **Step 3: Implement** `src/about/city-governor.ts`

```ts
/** QUALITY (owner: a render distance that adapts; then "on other people's devices it stutters, on mobile it's very
 *  laggy"): four tiers of far plane, fog, shadows, pixel size, real point lights and the far LOD's density — and the
 *  governor that steers a render scale and the tier by the measured frame. Pure, tested; city3d.ts applies it. */
export interface Tier { label: 'low' | 'mid' | 'high' | 'ultra'; far: number; fog: number; shadows: boolean; pix: number; lights: number; lod: [number, number] }
export const TIERS: Tier[] = [ // (the whole map inside the fence at every tier; ring 1 at every tier; ring 2 from high; the far LOD's rings always — dense from high, sparse below: masses 24 and 40 high instead of 12 and 24)
  { label: 'low', far: 20000, fog: 0.0003, shadows: false, pix: 3, lights: 0, lod: [24, 40] },
  { label: 'mid', far: 20000, fog: 0.0003, shadows: false, pix: 2, lights: 8, lod: [24, 40] },
  { label: 'high', far: 20000, fog: 0.00028, shadows: true, pix: 1, lights: 14, lod: [12, 24] },
  { label: 'ultra', far: 20000, fog: 0.00025, shadows: true, pix: 1, lights: 18, lod: [12, 24] },
];
/** A phone's budget: ring 2's stand-in takes masses 20 high and rings 3–4 take 40; real point lights 0 at low, 4 at mid; the render scale floors at 0.6 of CSS. */
export const PHONE = { lod: [20, 40] as [number, number], lights: [0, 4], floor: 0.6 };
export interface Device { connection?: { effectiveType?: string; saveData?: boolean; downlink?: number }; hardwareConcurrency?: number; deviceMemory?: number }
/** The opening tier: high; mid on a phone or a small device; low under saveData or 2G. A connection never promotes (it says nothing of the GPU: a fast line on a weak laptop opened at ultra and stuttered for ten seconds). */
export function startTier(dev: Device, mobile: boolean): number {
  const c = dev.connection;
  let t = 2;
  if (c && (c.saveData || c.effectiveType === 'slow-2g' || c.effectiveType === '2g')) t = 0;
  else if (c && c.effectiveType === '3g') t = 1;
  if ((dev.hardwareConcurrency ?? 8) < 4 || (dev.deviceMemory ?? 8) < 4) t = Math.min(t, 1);
  if (mobile) t = Math.min(t, 1);
  return t;
}
export const SLOW = 20, FAST = 17.5, BUSY = 9, WINDOW = 90;
export interface Governor { tier: number; scale: number; ceiling: number; floor: number; until: number; lastChange: number; lastDown: number }
export const newGovernor = (tier: number, now: number, floor = 0.6): Governor => ({ tier, scale: 1, ceiling: TIERS.length - 1, floor, until: now + 3000, lastChange: now, lastDown: now });
export type Steer = 'scale-down' | 'down' | 'scale-up' | 'up' | null;
/** A window's verdict: `avg` the frames' mean interval (ms), `busy` the CPU's share of a frame (the steps and the render's submission), at `now` (ms). Long frames shrink the scale by a fifth to the floor, then step the tier down and close the tier above for the session; short frames with headroom, twelve seconds after the last step down, grow the scale back and then the tier up to the ceiling. Two seconds' cooldown after a scale change, four after a tier down. */
export function steer(g: Governor, avg: number, busy: number, now: number): Steer {
  if (now < g.until) return null;
  if (avg > SLOW) {
    if (g.scale > g.floor + 1e-9) { g.scale = Math.max(g.floor, g.scale * 0.8); g.until = now + 2000; g.lastChange = now; g.lastDown = now; return 'scale-down'; }
    if (g.tier > 0) { g.tier -= 1; g.ceiling = g.tier; g.scale = 1; g.until = now + 4000; g.lastChange = now; g.lastDown = now; return 'down'; }
    return null;
  }
  if (avg < FAST && busy < BUSY && now - g.lastDown >= 12000) {
    if (g.scale < 1 - 1e-9) { g.scale = Math.min(1, g.scale * 1.15); g.until = now + 2000; g.lastChange = now; return 'scale-up'; }
    if (g.tier < g.ceiling) { g.tier += 1; g.until = now + 2000; g.lastChange = now; return 'up'; }
  }
  return null;
}
```
(The test's fourth case counts twelve seconds from the last *down* — the scale-down at 21,200 — so the scale-up lands at 33,200 or later: write the test's times accordingly: `23300 → null`, then `33300 → 'scale-up'`, `35400 → 'scale-up'`, `37500 → null`.)

- [ ] **Step 4: Run** — PASS (5 tests).
- [ ] **Step 5: Commit** — `git add src/about/city-governor.ts tests/city-governor.test.ts && git commit -m "feat(about): the governor — the tiers table, the opening tier, the steering, pure"`

---

### Task 6: The governor wired (city3d.ts)

**Files:**
- Modify: `src/about/city3d.ts` — delete the local `Tier`/`TIERS`/`startTier`; import `PHONE, TIERS, newGovernor, startTier, steer, WINDOW` from `./city-governor`; `let tier = startTier(navigator as Device, isMobile())`; `const gov = newGovernor(tier, performance.now(), 0.6)` beside it; `deskScale = () => Math.min(dpr, 2) / PIX * gov.scale`; the phone's scale `phoneCeil * gov.scale` (delete `phoneScale`, `phoneRenderSum`, the phone block in `tickWorld`); `POOL` → `TIERS[t].lights` / `PHONE.lights[t]` in `setPool` calls; the far LOD built at both densities gated by tier; the loop's ladder → `steer`; `setQuality` sets the governor.

- [ ] **Step 1: The far LOD by density** — replace the `build` gating and the two device lines with

```ts
    const lodGates: { o: Object3D; on: (t: number) => boolean }[] = []; // ring 2's stand-in below high; the dense rings from high, the sparse below (applyTier)
    const build = (ts: CityTile[], minH: number, on: (t: number) => boolean) => {
      for (const [qx, qz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const quad = ts.filter((t) => (t.dx >= 0 ? 1 : -1) === qx && (t.dz >= 0 ? 1 : -1) === qz);
        if (!quad.length) continue;
        const inst = new InstancedMesh(lodGeo(minH), [farWalls, dark], quad.length);
        quad.forEach((t, j) => { lm.makeTranslation(t.dx, 0, t.dz).multiply(lr.makeRotationY(t.q * Math.PI / 2)); inst.setMatrixAt(j, lm); });
        inst.instanceMatrix.needsUpdate = true;
        inst.visible = on(tier);
        lodGates.push({ o: inst, on });
        scene.add(inst);
      }
    };
    if (isMobile()) { build(cityTiles(2, 2), PHONE.lod[0], () => true); build(cityTiles(4, 3), PHONE.lod[1], () => true); }
    else {
      build(cityTiles(2, 2), TIERS[0].lod[0], (t) => t < 2);
      for (const h of new Set(TIERS.map((t) => t.lod[0]))) build(cityTiles(4, 3), h, (t) => TIERS[t].lod[0] === h);
      for (const h of new Set(TIERS.map((t) => t.lod[1]))) build(cityTiles(7, 5), h, (t) => TIERS[t].lod[1] === h);
    }
```
and in `applyTier`: `for (const g of lodGates) g.o.visible = g.on(tier);` (replacing the `lod2` line); `setPool(isMobile() ? PHONE.lights[tier] : T.lights)`.

- [ ] **Step 2: The loop** — replace the ladder block (`if (now > lastChange && dt < 250) { … }`) and its state (`frames, spent, lastChange, ceiling`) with

```ts
    if (dt < 250) { // the governor's window (city-governor.ts): the frames' mean interval and the CPU's share
      spent += dt; frames += 1; busy += stepsMs + timing.render;
      if (frames >= WINDOW) {
        const verdict = steer(gov, spent / frames, busy / frames, now);
        spent = 0; frames = 0; busy = 0;
        if (verdict === 'down' || verdict === 'up') { tier = gov.tier; applyTier(); }
        if (verdict) fit();
      }
    }
```
where `stepsMs` is the frame's steps' cost (`steps * stepCost`, 0 when none) — measure the steps before the window's accounting. `setQuality`: `gov.tier = tier; gov.ceiling = tier; gov.scale = 1; gov.until = performance.now() + 30000;`. The context-restored handler sets the same at tier 0.

- [ ] **Step 3: Gates and the pane** — tsc; reload at 1280 × 720: `quality()` reads `high`, scale 1; `setQuality(0)`: `info().triangles` 6.3 M → ~3.7 M; `setQuality(2)`: 8.1 M; the phone preset: ring 2's stand-in at 20 and rings 3–4 at 40 → `info().triangles` 4.1 M → ~3.3 M; lights: `probe().lights.length` 14 at high, 0 at low.
- [ ] **Step 4: Commit** — `git commit -am "feat(about): the governor wired — a render scale before the tier, sparse far rings below high, no promotion by the connection"`

---

### Task 7: A phone's post chain (city-post.ts, city3d.ts)

**Files:**
- Modify: `src/about/city-post.ts` (`LensPass` takes `cheap`, a `SOFT` define), `src/about/city3d.ts` (no haze pass on a phone, the bloom at half size, the lens cheap).
- Test: `tests/city-post.test.ts` (new)

- [ ] **Step 1: The failing test**

```ts
import { describe, expect, it } from 'vitest';
import { fov24, LensPass } from '../src/about/city-post';

describe("A phone's lens (owner: mobile is very laggy)", () => {
  it('compiles without its four softness fetches when cheap, with them by default', () => {
    expect((new LensPass({ cheap: true }) as unknown as { mat: { defines: Record<string, number> } }).mat.defines.SOFT).toBe(0);
    expect((new LensPass() as unknown as { mat: { defines: Record<string, number> } }).mat.defines.SOFT).toBe(1);
    expect(fov24(16 / 9)).toBeCloseTo(2 * Math.atan(Math.tan(Math.atan(18 / 24)) / (16 / 9)) * 180 / Math.PI, 6);
  });
});
```

- [ ] **Step 2: Implement** — in `LENS_FRAG` wrap the four extra fetches: `#if SOFT\n col = col * 0.4 + 0.15 * (…);\n#endif`; the constructor `opts: { k?; ca?; vig?; soft?; cheap?: boolean }` adds `defines: { SOFT: opts.cheap ? 0 : 1 }`. In city3d: `const phone = isMobile();` then `if (!phone) composer.addPass(haze);`, `const lens = new LensPass(phone ? { cheap: true } : {});`, and after `const bloom = …`: `if (phone) { const full = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => full(Math.ceil(w / 2), Math.ceil(h / 2)); }`.
- [ ] **Step 3: Gates and the pane** — tsc, vitest; the phone preset renders (a screenshot), no console error; the desktop unchanged.
- [ ] **Step 4: Commit** — `git commit -am "feat(about): a phone's post chain — no haze pass, the bloom at half size, the lens without softness"`

---

### Task 8: Gates, docs, deploy

- [ ] `npx tsc --noEmit`; `npx vitest run` (all green); `npx vite build`.
- [ ] The pane at 1280 × 720 and the phone preset: `info()` before/after in the spec's "As built"; screenshots of the smoke and the beacons; `tick(60)` runs clean.
- [ ] Spec "## As built" appended (the measured calls and triangles per tier and device, anything that changed while building); the plan's boxes ticked.
- [ ] Commit, `git push -q origin master`, `gh run watch --exit-status`, curl the live page and the city chunk for `blendMover`'s work (a `renderTime`-shaped string survives minification poorly — check the chunk hash changed and the page is 200).
- [ ] Memory bullet in `revachol-portfolio-site.md`.
