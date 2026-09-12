# The Roads' Depth Ladder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the city-wide flicker of roads and lane paint by giving every flat paint layer a distinct polygonOffset rung, so the depth buffer never decides a winner by rounding noise.

**Architecture:** One pure data module (`city-paint.ts`, the PAINT ladder) consumed by `city3d.ts`: the ground and patches pushed back, the strips/boulevard/arterial/crossing paint on their existing rungs renamed to real GL units, the junction boxes split across three rungs, the light decals pulled in front of everything.

**Tech Stack:** three.js 0.185, TypeScript strict, vitest.

## Global Constraints

- No plates or black boxes behind chrome; never touch `about-old.html`; no real text on signs.
- Gates before commit: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`.
- Bash-first workflow while auto mode is active.

---

### Task 1: The ladder module

**Files:**
- Create: `src/about/city-paint.ts`
- Test: `tests/city-paint.test.ts`

**Interfaces:**
- Produces: `PAINT: { ground: 6; patch: 3; roadX: 0; roadZ: -1; laneX: -2; laneZ: -3; boulevard: -4; arterial: -5; junction: -6; zebra: -10; stop: -11; decal: -14 }` (readonly; values are `polygonOffsetUnits`, greater = behind).

- [x] **Step 1: Write the failing test** (ground behind all with patches between; stack order strips → boulevard → arterial → junction; three box rungs (`junction`, `junction-1`, `junction-2`) above zebras/stops by ≥ 2; decals ≥ 2 below everything).
- [x] **Step 2: `npx vitest run tests/city-paint.test.ts`** — FAIL (module missing).
- [x] **Step 3: Write `city-paint.ts`** (the table above, `as const`, with the depth-quantum comment).
- [x] **Step 4: `npx vitest run tests/city-paint.test.ts`** — PASS.

### Task 2: The ladder wired through the renderer

**Files:**
- Modify: `src/about/city3d.ts` (groundMat, patchMat, streetMat, layStrips + 8 calls, laidRoad + arterial call, the diagonal's mesh, zebraMat, lineMat, the junction boxes → 3 meshes, throws/spill/pools decals)

**Interfaces:**
- Consumes: `PAINT` from Task 1.

- [x] **Step 1: Splice via a node script with exact-count replacements** (`rep()` throws on wrong counts):
  - import `PAINT`;
  - groundMat/patchMat gain `polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: PAINT.ground|patch`;
  - `streetMat(strip, repeat, units = 0)` — `polygonOffset: units !== 0, polygonOffsetFactor: units > 0 ? 1 : -1, polygonOffsetUnits: units`; callers pass `PAINT.*`;
  - `layStrips(..., units)` forwards; the 8 calls name `PAINT.roadX/roadZ/laneX/laneZ`;
  - zebra `PAINT.zebra`, stops `PAINT.stop`;
  - `boxMats[0..2]` at `PAINT.junction - k`; `boxes3[k]` instanced meshes (rung 2 capacity ×2); the lay line uses `Math.min(i, 2)`; the hull keeps `boxMats[0]`; the ring-1 copy and counts loop over the three;
  - throws/spill/pools units → `PAINT.decal`.
- [x] **Step 2: Gates** — `npx tsc --noEmit`, `npx vitest run`, `npx vite build` all green.

### Task 3: Pane verification and delivery

- [x] **Step 1:** Reload the pane at 1,280 × 720, `setQuality(2)`, night; the tie probe (±2 on the ground) at the aerial/street/avenue poses → ~0; the slide probe before/after; screenshots at aerial + avenue (wait before capture); phone preset boot check.
- [x] **Step 2:** Append the honest "As built" to the spec.
- [x] **Step 3:** Commit, push, `gh run watch --exit-status`, curl the live chunk, memory bullet, closing report.
