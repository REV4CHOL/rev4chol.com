# The fog of war, natural; the searchlights' mounts — plan

> Autonomous mode. Spec: `docs/superpowers/specs/2026-09-07-about-city-fog-and-searchlights-design.md`.

**Goal:** the fog of war and a distance blur past the fence, natural and seamless; every searchlight attached to
something in a logical way.

**Architecture:** the fog chunk the renderer patches into every material gains a gradient out of the fence's square
and writes the amount into alpha for opaque surfaces; a `HazePass` (city-post) blurs by that amount between the scene
and the bloom. The plan's `Searchlight` gains a `mount`; the renderer builds the fixture and the mount from it.

**Tech Stack:** three.js 0.185 (ShaderChunk, EffectComposer passes), vitest.

---

### Task 1: the haze pass

- [x] `HazePass` in `src/about/city-post.ts`: twelve Vogel taps, radius 0.65 % of the height at full amount, taps
      weighted by their own amount against the centre's; `setSize` from the composer.
- [x] Wired after the `RenderPass`, before the bloom (`city3d.ts`).

### Task 2: the fog of war as a gradient

- [x] Both fog chunk forms: `beyond = smoothstep(0, 900, length(max(|xz| − 280, 0)))`, `fog = max(fog, beyond · 0.985)`,
      the far-plane fade kept; the mixed form writes `alpha = 1 − beyond` under `#ifdef OPAQUE`.

### Task 3: the mounts

- [x] `Searchlight.mount` in the plan: `top` (the stadium's masts, the lamps 1.6 above the tops), `mast` (the
      megastructure's second-tier corner, base 74; the wheel's west side, base 0), `ring` (the first stack, r0 1.4,
      r1 3.6, six below the crown).
- [x] The renderer: a drum turning with the beam (its lens face lit), a yoke and axle turning with the sweep, a pivot,
      a railed deck 1.6 below the lamp; a lattice mast (four legs, rungs every 2.4) or a railed ring for the mounts.
- [x] `tests/city-plan.test.ts`: every lamp clear; a top on a mast that stands; a mast's base on a roof or the ground,
      its run in the open; a ring about a solid, the lamp within it.

### Task 4: verification

- [x] `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.
- [x] On the pane: the wheel's lattice mast with its deck and drum; the stack's ring under its beam; the fog
      thickening down the copied avenue from the fence and into a haze band from the air; 4.1 ms of render at the
      high tier.

## Status

Built 2026-09-07 (commit in the spec's "As built").
