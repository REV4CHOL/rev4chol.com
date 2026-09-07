# The About city's plain borders — implementation plan

> Autonomous mode: executed inline in this session, gates between tasks (tsc, vitest, build, the pane).

**Goal:** the seven points of specs/2026-09-08-about-city-plain-borders-design.md.

**Files:** `src/about/city-plan.ts` (CANAL_END, the canal's extent, the outer ring's avenue lots, OUTER_PROFILE,
`isMass`, `plan.filler` via `fillTiles`), `src/about/city3d.ts` (the windows' footprint fade; the finite canal; the
tiles' dressing cut back; the filler through the tiles; the corridor cull; `plainSpot`; the highway's continuation;
the far fleet's bodies and light pairs), `tests/city-plan.test.ts` (the canal's end, the filler, the outer ring's
avenue lots, bridges), docs, memory.

- [x] Task 1 — city-plan.ts: `CANAL_END`; the canal street, bridges, quay lamps, trees and posts end at the rim; the
      outer ring builds `bx === 0 || bz === 0`; OUTER_PROFILE lo 10 hi 36 stack 2; `export const isMass`; `fillTiles`
      → `plan.filler`; Plan interface + return. Tests in city-plan.test.ts. `npx vitest run tests/city-plan.test.ts`.
- [x] Task 2 — city3d.ts: the living-windows footprint fade (`skinMaterial`). Pane A/B.
- [x] Task 3 — city3d.ts: the ground's slot filled past `CANAL_END`, water / sheen / quay walls `2 · CANAL_END`, head
      walls; delete the copied avenues' water and sheen, the copied decks, `bridgesBeyond`, the copied
      arterial / boulevard / highway strips, the rail / bridge-lamp / deck-tube glow copies.
- [x] Task 4 — city3d.ts: the filler in the copies, copied trees / kit inside a filler dropped, `plainSpot` on the
      copied glow (heads, lanterns), the corridor cull on masses, glow and paint copies.
- [x] Task 5 — city3d.ts: the highway's continuation (deck, parapets, edge lights, tubes, piers, arterial strip, lamps).
- [x] Task 6 — city3d.ts: the far fleet: bodies + light pairs (ring 1 roads / lanes + the continuation within 1,250),
      single lights in ring 2; phones lights only.
- [x] Task 7 (f1d4fed, 44f2649) — gates: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`; the pane (desktop path): shimmer A/B,
      the canal's end, the highway east / west, a tile view, timings. Commit, push, deploy, live check, docs as built,
      memory.
