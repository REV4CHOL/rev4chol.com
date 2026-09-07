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

## Follow-up: the seams (2026-09-08, HASH)

Owner, with a shot down the avenue past the fence: "we can't just leave these roads empty outside the boundaries like
this. Animate them too like our city within the boundaries. I want our borders to look seamless." The tiles carried
the masses alone: no road surface, no paint, no lamps, no traffic, and the copied avenues were bare ground while the
real canal ran on past the fence with no bridges. Now every tile carries:

- **the roads**: the grid roads and lanes through `layStrips` (the city's own merged strips; one mesh per axis a ring,
  untrimmed since no traffic node lies there), the arterial's strip, the boulevard's, the highway's deck; the first
  ring's junctions wear the same boxes, zebras and stop lines (the instanced paint copied through the tiles);
- **the lamps and bars**: the lamp heads' glow, the lanterns, the deck tubes through both rings (`tileGlow`); the LED
  strips and edges through the first (`tileBars`, a turned tile turning a bar's footprint); the sprawl's placeholder
  lamps, their pools and practicals are gone;
- **the water**: the copied avenues carry the canal's tone and its moving sheen laid on the ground (the real canal is
  sunk between quay walls; at four hundred units the walls are nothing), and a deck at every copied crossing with the
  rails' and lamps' glow; the real canal carries the city's bridges past the fence (`bridgesBeyond`);
- **the masses**: trees and the structural darks (piers, tanks, legs: six up and over a unit across) join, so the copied
  decks stand on something;
- **the far traffic**: a warm head and a red tail a vehicle in every lane of every road, lane, arterial, boulevard and
  deck, one Points a ring, the vertex shader driving each vehicle along its lane by a phase and a speed (nothing is
  simulated), dimmed with the lamps by day, fogged as the pools are; the point size follows the frame. 55,722 lights
  in the first ring at a vehicle every forty lane-units, thinner in the second.

Measured on the pane: 3,022 pixels of a quay-road band change over sixty ticks (the lights move); 5.2 ms of render
at the high tier with everything.
