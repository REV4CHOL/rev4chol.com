# The About city: plain borders, an endless highway, a fleet in the distance, still windows

**Date:** 2026-09-08 · **Status:** approved (autonomous mode: the owner's seven points are the brief) · **Owner's words:**

> 1. Highway should be infinite both side. 2. At the boundaries, all the vehicle and streets still should be matched
> to our scale, before gradually turn into small lights and stuff like this (it should happen at very far away tho).
> SO still fully animated the streets beyond boundaries at normal, and gradually transition into smaller stuff etc.
> like this current state. 3. Entire rivers and bridges are glitching outside the border. 4. Window bug that you told
> me you fix: it's still here. 5. Remove all highways outside the borders. Fill in with buildings and streets. 6. Also
> the area around the border should be packed with buildings. 7. Also right now I see for example at river, then
> beyond border extend river to infinity. Same for boulevards, etc. STOP ALL OF THESE. Just fill in buildings. I don't
> want to see any boulevards, rivers, etc. outside the border. They are breaking immersion of this fog of war.

## What is wrong today

The endless city (specs/2026-09-07-about-city-endless-design.md) copies the whole built square — core and outer
ring, ±399 — into eight rotated tiles (twenty-four at the high tier), and the seams follow-up (0a3a7cf) dressed the
copies with everything the square has: the arterial's strip and the boulevard's, the highway's deck, the canal's water
where the copied avenue runs, bridge decks at every copied crossing, and the real canal's bridges carried past the
fence. That was the wrong reading of "seamless". Seen from the fence, the copies now show the city's *unique* things
over and over: a river every 800 units in some direction, a boulevard slashing a copied quadrant, a highway deck at a
random angle, water planes fighting the copied road strips (the "glitching" of point 3) and bridges over tiles that
were turned so their water is elsewhere. The real canal's water and quay walls run the whole 4,000-unit ground, so
the river visibly goes on to infinity (point 7). The highway's deck ends at ±400 against a turned copy (point 1). The
far traffic is lights only from the first copied street on, so the vehicles jump from full-size bodies to dots at the
seam (point 2). And the windows still shimmer under motion on the owner's PC (point 4).

## The windows (point 4)

**Cause, measured this session on the pane (Chromium on ANGLE, the owner's stack):** the living-windows mask in
`skinMaterial` (city3d.ts) — which windows are dark right now — is computed *per fragment* from the window cell under
the pixel centre. The atlas is mip-filtered (a28f6a3), but a procedural mask cannot be: once a window cell covers a
pixel or less, each pixel samples one random cell of the several it covers, the choice changes with every sub-pixel
move of the camera, and the far facades crawl. A/B on the pane at native resolution with MSAA: a one-pixel sideways
shift changes 0.18 / 0.43 / 0.14 % of the frame's upper half by more than 60 luminance with the mask on, and 0.04 /
0.06 / 0.02 % with it off (skyline / wide / far views). MSAA cannot touch it (the shader runs once a pixel), which is
why the last fix (native pixels + MSAA 4) did not.

**Fix:** fade the mask to its mean with the pixel footprint. In the fragment shader the footprint of a pixel in window
cells is `fp = (abs(dFdx(px)) + abs(dFdy(px))) / uPitch[fam]`; with `m = max(fp.x, fp.y)` (cells a pixel), the window's
own off-state is used where a cell spans more than three pixels and blends to the *mean* off-state
(0.45 × 0.3 = 0.135: the share of windows that cycle times the share of the cycle spent dark) by the time a cell is a
pixel: `woff = mix(woffCell, 0.135, smoothstep(0.3, 1.0, m))`. Near, every window still switches on its own; far, the
facade holds its average brightness and nothing crawls. Verified by the same A/B metric.

## The canal ends at the rim (points 3, 7)

The plan keeps its canal, but it ends where the main city ends: `CANAL_END = streetAt(HALF) + STREET / 2` (292). The
last bridge inside the fence, at the rim street (285), carries the water's end under its far edge, so from the fence
the canal reads as going under the last bridge into a culvert — no wall in view. In city-plan.ts:

- the `canal` street runs `-CANAL_END..CANAL_END`; the boats' run follows (they use its length);
- bridges only at crossings `j ∈ [-HALF-1, HALF]` (the arterial's crossing still excepted); the quay posts and
  lanterns, the tree-lined avenue's trees and posts stop at `|t| ≤ streetAt(HALF)`;
- the outer ring builds its avenue lots too (`bx === 0 || bz === 0` no longer skipped): past the rim the two avenues
  become ordinary streets between ordinary blocks.

In city3d.ts the water, its sheen and the quay walls are `2 · CANAL_END` long, a head wall closes each end, and the
ground's slot is filled past the ends with two ground rectangles (the same lot-stone UV mapping). Nothing of the
canal — water, bridge, quay — exists past 292 in any direction.

## The tiles carry a plain city (points 5, 7)

The copies keep: the masses, the grid roads and lanes (strips), the first ring's junction paint, the road lamps'
glow, the lanterns, the LED bars, and moving traffic. They lose: the arterial's and the boulevard's strips, the
highway's deck, the copied avenue's water and sheen, the copied bridge decks, `bridgesBeyond`, and the copies of the
deck tubes', the rails' and the bridge lamps' glow. The corridors those things left empty in the copies — the canal's
column, the tree avenue's median, the boulevard's diagonal, the arterial's band, the plaza, the citadel's and the
megastructure's and the landmark's blocks — are FILLED:

**`plan.filler: Solid[]`** (city-plan.ts, `fillTiles`, called at the end of `planCity` on its own random stream): for
every block `(bx, bz)` of the built square, the lot is cut into four 12 × 12 quarters; a quarter is *taken* when a
copied mass (`isMass(s)`: facade / cyl / spire / pyr / dome, or a dark six up and over a unit across — the renderer's
own filter, now exported — with `h ≥ 4`, trees and street kit excepted) overlaps it by more than 1.5 units both ways;
the free quarters are joined into halves or a whole lot at random and each piece becomes one facade box (gutter
0.8–1.6, a height from the block's district profile with the block's jitter and the odd spike, tex from the eighteen
ordinary styles, arch `sprawl` so no shopfront), one in seven with a set-back upper box. The filler is drawn ONLY in
the tiles (never in the built square); copied trees and street kit standing inside a filler box are dropped from the
copy. Tests: every filler box inside ±399, clear of every counted mass, and every block of the square at least half
covered by copied masses plus filler.

**The real highway's corridor through the tiles** (see below): copied masses and filler whose footprint comes within
`ARTERIAL_ROW + 1` of the highway's line are skipped, copied glow points within `ARTERIAL_ROW` of it are skipped, and
so are the copied paint instances there.

**Copied glow** is filtered in the plan's frame by `plainSpot(x, z, y)`: not on the deck (`y` unset or 0), farther than
`ARTERIAL_ROW + 1` from the arterial's line, farther than `DIAGONAL.width / 2 + 3` from the boulevard's, and not inside
a filler box — so no lamp floats where a copied arterial or boulevard used to be, and none stands inside a filler.

## The highway, endless (point 1)

The real highway continues past both ends of the built square along its own line, `HW_FAR = 1600` units each way
(to x ≈ ±2000: the fog of war is 0.985 at 900 out of the fence, the far plane fades at 1050–1450). Per end, in
city3d.ts: the deck box with its strip, both parapet walls unbroken, amber edge lights every 3, the cold tubes under
the deck every 10, piers with hammerhead caps every 19.2 in the median, the arterial's strip beneath (the same
`laidRoad`), lamp heads on the arterial's pavements every 12 and on the parapets every 30 (the plan's own spacings),
and traffic on all its lanes (three a side on the deck, two a side on the arterial). The continuation is ring-1
visibility (every tier; a phone builds it too, it is a handful of boxes). The tiles' masses are culled from its
corridor (above), their road strips pass beneath it as the core's do.

## The fleet in the distance (point 2)

The far traffic keeps its GPU drive (a start, a lane, a phase, a speed; the vertex shader moves everything) and gains
BODIES. For the first ring's roads and lanes and for the highway continuation's lanes within 1,250 of the origin, every
vehicle is an instanced box of the sim's own sizes and mix (`SPEC`, `populate`'s odds by street kind: cars, taxis,
buses, trucks, motorbikes) in the real fleet's wraps (`carTextures`, cloned materials) and colours, a warm headlight
pair at its front and a red tail pair at its back (the lights ride the same lane at the same phase). Per lane one
speed, so nothing overtakes through anything; vehicles evenly spaced with jitter. The second ring keeps single lights
only. Seen from the fence the copied streets carry vehicles of the city's size; with distance the bodies shrink to
nothing while the lights hold their minimum pixel and remain — the transition to "small lights" happens by
perspective, far out, not at the seam. A phone keeps lights only (no bodies: its frame is spoken for).

## The border, packed (point 6)

The outer ring's avenue lots are built (above). Its profile rises from a low-rise ring (6–24) to `lo 10, hi 36,
stack 2` so the skyline does not step down at the fence; the avenue air lanes lift over whatever stands under them
(`lift`), as they always did. The industry lots stay industry.

## Not changed

The fog of war and the haze (e7402ca), the fence, the tiles' rings and rotation, the real traffic (the highway still
portals at its ends; its far end is the continuation's start), the runners, the people, about-old.html.

## Verification

tsc clean, vitest green, vite build; on the pane at the desktop path (150 runners): the shimmer A/B (big changes
under a one-pixel shift ≤ 0.06 % in the three views), the canal's end from the fence (water gone past the last
bridge, blocks beyond), the highway seen east and west from the fence (deck running into the fog), a tile view (no
water, no boulevard, no deck; blocks where they were; vehicles with bodies), render time at the high tier.
