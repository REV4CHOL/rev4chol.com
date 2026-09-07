# The endless city — design

**Owner:** "Beyond boundaries, make the illusion of the city spanning infinite, like a mega massive city. It has to
look like our current city within the boundaries."

**Date:** 2026-09-07. Autonomous mode: the design is chosen and recorded here, the build follows in the plan.

## What was there

The main city is ±7 blocks and fenced; a 3-block outer ring past the fence is built by the same generator, so the
built city spans ±399 (21 blocks of 38). Past it a SPRAWL of low boxes (3,481 solids, two dim skins, 2,400 kerb
lamps, 900 neon specks) ran to ±960, but the renderer stopped placing it past 470 and, above all, the fog shader
carried a FOG OF WAR: a wall standing in the world, 97.5 % fog past 400 from the origin whatever the distance,
with a painted horizon ring (four planes of "the far city's glow" at 520) showing through it. From the fence, or
from the air, the city ended: a fog-coloured plain with a painted silhouette on it, then the sky.

## Approaches weighed

1. **Extend the plan's outer ring** (OUTER 3 → 12 blocks, the real generator). Faithful, but four to six times the
   solids in the collision grid, the plan several times slower in every test suite, and it still ends at a hard
   edge ±840.
2. **A painted skyline ring** on the dome (what the horizon ring already was). Cheap, but it cannot look like the
   city: no parallax, no depth, flat.
3. **Tiles of the city itself** (chosen): the built city's masses (facades, cylinders, spires, pyramids, domes; not
   the kit, not the trees, not the unique landmarks) copied into rings of tiles around it, each tile the whole
   ±399 square translated by multiples of its period (798) and turned a quarter turn or three so the landmarks'
   pattern does not repeat in step. The same instanced materials and atlas skins: the copies ARE the city's
   buildings, lit windows and all. The plan is untouched; the sprawl's solids and neon specks are no longer drawn
   (the copies stand where they stood); the sprawl's kerb lamps stay, on the tiles' streets. The fog of war's
   wall goes — the tiles are the "glimpses past the fence" now — and the distance fog owns them, with a full
   fade in the last stretch before the far plane so the plane never cuts a building. The horizon ring goes.

## The build

- `TILE_P = (2 · (HALF + OUTER) + 1) · G = 798`: the built square's span; the streets continue across the seams
  since the grid is symmetric under a quarter turn and periodic in 21 blocks, and the seam lies down the middle
  of a shared street.
- `cityTiles(rings)` (city-plan, pure, tested): ring 1 is the 8 tiles at offsets ±798; ring 2 the 16 around them
  at ±1596; each with a quarter-turn count from its coordinates. The far plane is 1500: ring 2's near edges lie at
  1197, inside it; its far edges beyond it, fogged out.
- The renderer places every mass of core + outer once per tile into tile buckets (`t1:` / `t2:`) with the core's
  materials (their skins drawn from the tiles' own random stream, so the city's own look is unchanged), no shadows
  cast or received, and gates them by tier: ring 1 at every tier, ring 2 from `high`. 8,645 masses a tile: 69,160
  instances in ring 1, 207,480 with ring 2, a handful of draw calls.
- The fog chunk (every material at once): the wall `max(fog, smoothstep(292, 400, edge) · 0.975)` is replaced by
  `max(fog, smoothstep(1050, 1450, depth))`; the street haze stays.
- The camera never leaves the fence (±280), so no tile comes nearer than 120; the fog does the rest.

## Tests

- `cityTiles`: 8 and 24 tiles, none overlapping the built square, the period the square's span, every tile inside
  the far plane's reach on its near edge, the first ring turned more than one way.
- The existing plan tests are untouched (the plan is).

## As built

Commit d6c86f0, 2026-09-07. Built as designed, with two findings on the way:

- The copies came out as fog-coloured silhouettes at every distance, whatever material they wore. The cause was not
  the skin shader (a plain standard material was as dark) nor the geometry (a red unlit material showed the masses
  in place): the fog chunk the renderer patches into every material carried the FOG OF WAR — a wall in world space,
  97.5 % fog past 400 from the origin, whatever the distance — and a painted horizon ring at 520 stood in front. Both
  are gone; the last stretch before the far plane fades out fully instead.
- The tile buckets draw their skins from their own random stream, so the city's own look is unchanged by them.

Numbers: 8,645 masses a tile; 69,160 instances in ring 1 (every tier, a phone builds this ring only), 207,480 with
ring 2 (from the high tier); 4.4 ms of render at the high tier on the owner's PC with both rings.
