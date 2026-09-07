# About City Alive — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three bugs (glow on movement, jitter, mobile freeze) and deliver the nine ideas: the cat, city-wide fireworks, crowds and traffic, flying traffic between buildings, the stadium and wheel precinct, rooftop parkour, the highway's surroundings, honest intersections, the boulevard cut with the citadel.

**Architecture:** Renderer (`city3d.ts`, `city-post.ts`) for the bugs, fireworks, flyers, the cat and runner drawing; plan (`city-plan.ts`) for the cat's roof, fireworks sites, air lanes, precinct kit, citadel, apron kit and the boulevard cut; traffic and people counts; a new `city-runners.ts` for the parkour sim.

**Tech Stack:** Vite 7, TypeScript strict, three.js 0.185, vitest 3.

## Global Constraints

- No real text on any sign; calm stills idle motion (but no longer the city); about-old.html untouched; no plates behind chrome.
- Gates before every commit: `npx tsc --noEmit; echo "tsc exit=$?"`, `npx vitest run`, `npx vite build`.
- The flow test's worst stopped fraction stays under 0.5 at the new vehicle count; no meeting; the flight forces no leg.

---

### Task A: Bugs — commit `fix(about): no motion streak, no texture jitter, a phone that keeps moving`
- [ ] Remove `MotionBlurPass` from the composer and the file; the lens target without a depth texture.
- [ ] Linear magnification on facades, normals and strips; anisotropy 8/16; `PCFSoftShadowMap`; `rvlRide.shimmer()`.
- [ ] Mobile: half pixels, trimmed counts, adaptive sim rate from `rvlRide.timings()`, calm slows instead of stops, tour keeps rendering, context loss restored.
- [ ] Deploy.

### Task B: The highway's surroundings and the intersections — commit `feat(about): the viaduct's yokocho, honest aprons and zebras`
- [ ] Apron texture; slips above the aprons; under-deck kit; lamps.
- [ ] Zebra reach through angled streets.

### Task C: The boulevard cut — commit `feat(about): the citadel on the boulevard`
- [ ] Two diagonal halves; the citadel; neon kerbs, gantries, screens.

### Task D: Crowds and traffic — commit `feat(about): a crowded city`
- [ ] Counts up, weights up, sim cost checked.

### Task E: Flying traffic — commit `feat(about): traffic between the buildings`
- [ ] Canyon lanes with height profiles, ring and arcs, six kinds.

### Task F: Fireworks — commit `feat(about): fireworks over the city`

### Task G: The cat — commit `feat(about): the cat on the tower`

### Task H: The precinct — commit `feat(about): the stadium and wheel precinct`

### Task I: Parkour — commit `feat(about): parkour on the roofs`
- [ ] `city-runners.ts` sim + tests; sprite frames; trails; renderer.

### Task J: Docs, memory, deploy.
