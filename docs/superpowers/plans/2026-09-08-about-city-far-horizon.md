# The About city's far horizon (twelve points) — implementation plan

> Autonomous mode: executed inline in this session, gates between tasks (tsc, vitest, build, the pane).

**Goal:** the twelve points of specs/2026-09-08-about-city-far-horizon-design.md.

**Files:** `src/shell/hud.ts` (SFX), `src/about/city-sky.ts` (TIMES order, `horizonColor`), `src/about/city-runners.ts`
(the pace), `src/about/city-traffic.ts` (PACE), `src/about/city-plan.ts` (the highway and arterial streets run
HW_FAR each way; the dressing loops keep to the square; `cityTiles(rings)` to 7), `src/about/city-far.ts` (new, pure:
`farMasses`, `mergeBoxes`, `farRingTiles`), `src/about/city-clock.ts` (new, pure: `stepsAllowed`), `src/about/city3d.ts`
(the sun and moon far; the exact corridor cull, the corridor filler, the copied streets cut at the corridor; the sim's
continuation vehicles, the far fleet without the continuation; the fog chunk, `uBeyond`, TIERS far / fog, the ground,
the merged clouds, the LOD meshes; AUTO's entry; the flyers' pace; the fixed-step clock; the phone's counts),
`index.html` + `works.html` + `about.html` + `contact.html` + `project.html` (the boot's gesture listeners),
`src/lib/music.ts` (toggle while silent), `src/shell/shell.ts` (pointerup, click), tests (`city-sky`, `city-runners`,
`city-traffic`, `city-plan`, `city-far`, `city-clock`, `music`, `music-boot`), docs, memory.

- [x] Task 1 — small decrees: hud.ts SFX; city-sky.ts TIMES order (+ test); city-runners.ts pace (+ test bounds);
      city-traffic.ts PACE 0.6 (+ far fleet SPD, the flyers' pace in city3d.ts). `npx vitest run tests/city-sky.test.ts
      tests/city-runners.test.ts tests/city-traffic.test.ts`.
- [x] Task 2 — city3d.ts: AUTO's entry (body re-seated, the aim seated, the pace and pan ramps); the sun and the moon
      at 6,000 (× 10). Pane: AUTO twice from FREE; dusk A/B.
- [x] Task 3 — the highway's own traffic: city-plan.ts streets 4,000 long (the dressing loops stay on the square, the
      arterial's `ends`), city3d.ts the second populate, the far fleet without the continuation, the deck / parapets /
      lights / strip on the streets' own lengths. Tests: city-plan (the streets' extents), city-traffic (the portal at
      the far end). Pane: the highway's end from the fence.
- [x] Task 4 — the corridor through the tiles: the exact cull, the corridor filler, the copied streets and far lanes
      cut at the corridor. Pane: the corridor from the fence, both ways.
- [x] Task 5 — the far horizon: city-far.ts (+ tests), city-sky.ts `horizonColor` (+ test), city3d.ts the fog chunk and
      `uBeyond`, TIERS, the ground, the clouds merged and fog-lit, the LOD meshes and their look, `cityTiles(7)`.
      Pane: 220 and the terminus, timings.
- [x] Task 6 — the phone: city-clock.ts (+ tests), the loop's accumulator and the rigs' dt, the counts, the LOD rings on
      the phone. Pane: the mobile preset (runners 70), a forced slow frame steps thrice.
- [x] Task 7 — the music on a phone: the boot snippet's gesture listeners in the five pages (+ music-boot test), music.ts
      toggle while silent (+ test), shell.ts pointerup / click.
- [ ] Task 8 — gates: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`; the pane's checks of the spec's
      verification; commit, push, deploy watch, live check; the spec's "as built"; memory.
