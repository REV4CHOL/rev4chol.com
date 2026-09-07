# The endless city — plan

> Autonomous mode. Spec: `docs/superpowers/specs/2026-09-07-about-city-endless-design.md`.

**Goal:** past the fence, the illusion of a city spanning infinite that looks like the city inside it.

**Architecture:** the plan is untouched; `cityTiles` (pure) names the tiles; the renderer copies the built square's
masses into instanced tile buckets with the city's own materials; the fog shader loses its wall at the fence and
gains a full fade before the far plane; the sprawl's boxes, neon specks and the painted horizon ring are no
longer drawn.

**Tech Stack:** three.js 0.185 instancing, the existing skin atlas, vitest.

---

### Task 1: `cityTiles` in the plan, tested

- [x] `TILE_P`, `CityTile`, `cityTiles(rings)` in `src/about/city-plan.ts` (the period 21 blocks, a quarter turn
      from the coordinates).
- [x] `tests/city-plan.test.ts`: eight and twenty-four tiles, none over the square, offsets multiples of the
      period, ring 2's near edge inside the far plane, the first ring turned more than one way.

### Task 2: the renderer's tile buckets

- [x] `place(s, far, tile?)`: a tile carries its matrix, its ring and its own random stream; `t1:`/`t2:` buckets;
      no shop light for a tile; no shadows cast or received; ring 1 visible at every tier, ring 2 from `high`
      (`applyTier`); a phone builds ring 1 only.
- [x] The masses copied: kinds facade, cyl, spire, pyr, dome of core + outer, less the arches mega, landmark,
      citadel (8,645 a tile).
- [x] The sprawl's solids and its neon specks no longer placed (its kerb lamps stay).

### Task 3: the fog and the horizon

- [x] The fog chunk (both the mixed and the additive form): the wall `smoothstep(292, 400, edge) · 0.975` replaced
      by `smoothstep(1050, 1450, depth)`; the header comment and the tier comment rewritten.
- [x] The horizon ring and `horizonTexture` removed; the look's `horizon` field left in the sky module (unused
      by the renderer now).

### Task 4: verification

- [x] `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.
- [x] On the pane at the high tier: from the fence, lit blocks to the horizon down a copied avenue; from 260 up,
      a lit city to the fog; the seam at street level unremarkable; 4.4 ms of render with both rings.

## Status

Built 2026-09-07 (d6c86f0).
- [x] Follow-up — HASH `feat(about): the endless city's roads, paint, lamps, water, bridges and far traffic through the tiles` (seamless borders: the strips, the junction paint, the glow, the bars, the copied avenues' water and decks, bridges on the real canal past the fence, trees and structural darks among the masses, GPU-driven far traffic).
