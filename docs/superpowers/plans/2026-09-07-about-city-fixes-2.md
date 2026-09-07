# About City Fixes 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the owner's eleven items: flat panes and soft glass, condensers off the windows, rails round every balcony, walkers that hold at a distance, a fixed sky of clouds, junction paint that reads, the boulevard cut with the citadel, the ramps cut and the undercroft built, the highway's carriageway verified clear, five times the runners.

**Architecture:** Renderer (`city3d.ts`) for the atlas paint, the glass, the sprite LOD, the clouds, the junction boxes; plan (`city-plan.ts`) for the condensers, the rails, the diagonal's halves, the citadel (rotated solids), the ramps' removal and the undercroft; `city-traffic.ts` gains the pure `armReach`; tests in `tests/`.

**Tech Stack:** Vite 7, TypeScript strict, three.js 0.185, vitest 3.

## Global Constraints

- No real text on any sign; calm stills idle motion (not the city); about-old.html untouched; no plates behind chrome.
- Gates before every commit: `npx tsc --noEmit; echo "tsc exit=$?"`, `npx vitest run`, `npx vite build`.
- The flow test's worst stopped fraction stays under 0.5; no meeting; the flight forces no leg.

---

### Task A: Panes, glass, sprites — commit `fix(about): flat panes, soft glass, walkers that hold at a distance`
- [x] Atlas: every pane opaque, brightness folded into the colour; shop glass and lettering too. `rvlRide.atlas()` probe.
- [x] Glass roughness 0.42 / metalness 0.45.
- [x] People shader: capsule LOD where a pixel spans more than a texel (`vLocal`, fwidth).
- [x] Pane checks: facade close-up, far street.

### Task B: Condensers and rails — commit `fix(about): condensers on the spandrels, rails round every balcony`
- [x] `bodyOf(fp)` → the body's tex and shop strip; the family's spandrel band; condensers there, sized to it.
- [x] Side rails on every balcony slab and fire-escape platform.
- [x] Tests: condensers in band; three rails per slab.

### Task C: Clouds — commit `feat(about): a fixed sky of clouds`
- [x] World-fixed flat puffs, 200 over a 2400 field at 300–560, low tier at 260–340, no drift, distance fade 560–640, tinted by the look.
- [x] Pane check: sky from the ground and from 150 up; warp between altitudes, clouds hold.

### Task D: Junctions — commit `fix(about): junctions that read`
- [x] `armReach` in `city-traffic.ts` + test (right angles unchanged; no zebra corner in another carriageway).
- [x] Renderer: zebra at reach + 0.2, stop line at reach + 1.8, box to reach + 2.4; convex-hull box at oblique nodes.
- [x] Pane check: the six-way at (−171, −95) from above, a four-way, a lane mouth.

### Task E: The citadel — commit `feat(about): the boulevard cut, the citadel`
- [x] `Solid.rotY`; renderer rotation; grid bounds. Diagonal → two halves; block reserved, inner crossing closed.
- [x] The citadel: tiers, spire, holo ring, portals, screens, pad, annexes, forecourts, POI.
- [x] Tests updated (kinds, diagonal count, citadel solid, districtOf); traffic test.

### Task F: Ramps cut, undercroft — commit `feat(about): the ramps cut, the undercroft built`
- [x] `ramps` empty, `mergesX` empty; slips/tapers/parapets gone from the renderer's ramp branch (dead code kept minimal).
- [x] Infill units on the aprons (arch `undercroft`), hanging kit under the deck.
- [x] Tests: no ramp; units in band; carriageway clear; highway clear at deck height; traffic runs end to end.

### Task G: Runners ×5, the deck survey — commit `feat(about): parkour everywhere`
- [x] Counts 300/120/150; ring 6000; cost test.
- [x] Deck survey end to end in the pane; texture close-ups (shopfront, hoarding, balcony, roof annex, lane mouth, gate).

### Task H: Docs, memory, deploy.

## Status (2026-09-07)

- [x] Task A — fb10d4f `fix(about): flat panes, soft glass, walkers that hold at a distance` (deployed).
- [x] Task B — 5980001 `fix(about): condensers on the spandrels, rails round every balcony` (deployed).
- [x] Tasks C and D — 1ed6ecf `feat(about): a fixed sky of clouds; junctions that read` (one commit: both live in `city3d.ts`).
- [x] Task E — 4d499aa `feat(about): the boulevard cut, the citadel`.
- [x] Task F — d1ee5be `feat(about): the ramps cut, the undercroft built`.
- [x] Task G — c6c4445 `feat(about): parkour everywhere` (the deck survey found nothing across it; the carriageway is asserted clear).
- [x] Task H — this commit: the spec's as-built section, this status, the memory entry; deploy verified.
- [x] Follow-up — cb4a226 `fix(about): no crowd where nobody would stand; pixel clouds` (market zones off the roads, knots and pauses off the crossings, no roof crowds, runners on the move, the stop line angle-aware, pixel clouds).
- [x] Follow-up 2 — f5c4115 `fix(about): the film layers off the city; a phone renders at its own pixels` (the window glitch was the site's grain overlay; the phone's render scale from its pixel ratio, adaptive).
- [x] Follow-up 3 — HASH `fix(about): the runners' pace, no city sound, the cat's tail and its searchlight, the PC's pixels, the works zoom, the tagline` (150 runners at a flight every ten seconds; city-audio gone; the tail a plan polyline outside the wall; the searchlights in the plan, none on the summit; MSAA, ratio-aware desktop scale, native-pixel high/ultra, a closed tier; wheel/trackpad/Safari zoom on the works floor; "filmmaker").
