# About page — the city alive (design)

Owner (2026-09-07), nine ideas and three bugs for the about page's city. Grouped by what they share, each with the
decision.

## Bugs first

| bug | cause | decision |
|-----|-------|----------|
| the glow whenever the camera moves | a MOTION-BLUR pass streaks the frame by reprojection while the camera moves | the pass goes; the composer keeps bloom and the lens; the render target drops its depth texture |
| jittering windows and road textures | every hand-pixel texture magnifies with NEAREST sampling (facades, their normal maps, the strips): at a texel a pixel the sampling flips as the eye moves; the shadow map is plain PCF | LINEAR magnification everywhere, anisotropy 8 on facades and 16 on the strips, soft PCF shadows; a `shimmer` probe on the debug handle measures the frame-to-frame change of a patch of the screen as the eye slides |
| mobile: the whole city frozen | three things stack: a phone renders at its OWN pixels (three times a desktop's count) through three full-screen passes; the two simulations step every frame whatever the frame costs; and under CALM (the persisted motion toggle) the world tick returns before anything moves and the tour renders only while scrolling — a still poster. A lost WebGL context freezes the last frame for good | a phone renders at half its pixels; the simulations are trimmed on phones (fewer people and vehicles) and step every other frame whenever a frame runs long; calm slows the city instead of stopping it (idle flicker still stilled) and the tour keeps rendering; a lost context is restored at the lowest tier |

## The ideas

1. **A giant orange cat** sits on the tallest wide roof near the heart of the heights: forty boxes in orange and cream,
   a lit green gaze, ears, stripes, the tail hanging over the parapet and swishing; it blinks and turns its head now
   and then (calm: still). Solid to the flight, a point of interest for the auto camera.
2. **Fireworks over the whole city**: eight launch sites on roofs around the districts; every few seconds one fires —
   a rocket streak climbing, then a burst of a hundred sparks falling and fading in the palette; two bursts may
   overlap. None by day, none in calm.
3. **Crowds**: people 2200 → 3800 on desktop, alleys and lanes weighted up (×4, ×2), more knots; vehicles 1500 → 2100.
   The simulations are timed per frame; the frame budget decides the step rate.
4. **Flying traffic between the buildings**: canyon lanes along every fourth street at 44–62 (with a height profile
   that hops the spans and the rail), a second ring, cross-city arcs at 110–140; flyers 34 → 160 in six kinds — car,
   taxi, shuttle bus, cargo lifter, courier drone, police — each its own build and lights.
5. **The stadium and wheel precinct**: a forecourt before each stadium gate with turnstiles, ticket booths, queue rails,
   food stalls, flags on the masts and a lit entrance arch; a boarding station under the wheel with a queue, a booth,
   an arch and lamps; crowds mill in both; the base's edge no longer swallows the arterial's pavement.
6. **Parkour**: sixty runners on the roofs of the city — they dance (hip-hop, a boombox) on a roof, run its length,
   vault its kit, leap the gap to a neighbouring roof within twelve, roll on landing; a gap up to sixty they cross on
   thrusters (a flame trail, a steep arc); now and then one rockets right across the city to a far roof, high over
   everything. On skyscrapers too. Three new sprite frames (run, leap, thrust); the rocket trail is sparks.
7. **The highway's surroundings**: the aprons re-laid as parking asphalt with bay lines, oil and patches — vehicular,
   not pavement — and the ramps' slips drawn OVER them (they were painted under: "cars on pedestrian lanes"); under
   the deck between the piers a yokocho — lantern-lit stall rows, container stacks, a tyre shop, a fuel canopy, graffiti
   boards on the piers, neon on the pier caps, sodium lamps along the aprons.
8. **Intersections**: a zebra never crosses another street's carriageway — at a six-way the reach along each arm is
   measured through the other streets at their angle, so the boulevard's zebras sit past the grid roads and the roads'
   past the boulevard.
9. **The boulevard cut**: the diagonal loses its middle two blocks; in their place stands THE CITADEL — a massive
   stepped complex on the boulevard's axis, a lit portal facing each half, screens, LED edges, a hologram crown, a
   drone pad — and both halves end at its forecourts. The halves get neon kerbs, hologram gantries every forty,
   screens on the flanking faces, the stages and bunting they had.

## Testing

Renderer changes are checked in the pane (shimmer probe, timings, screenshots). Plan: the cat's roof and its solid,
fireworks sites ≥ 8, runner roofs ≥ 200, air lanes clear of the grid with a margin, the precinct's zones and doors,
the boulevard in two halves with the citadel between, the arterial's slips laid above the aprons, no zebra inside
another carriageway. Traffic: the flow test at the new count. People: the runner sim keeps every runner on a roof
or in a leap between two, never inside a solid.

## As built (2026-09-07, commits cc6f833, 73a5ff5, 2303f43, b4dac5f, d2e8ede, bb756b1)

**Bugs.** As designed. The motion-blur pass is deleted from `city-post.ts` (the composer is render → bloom → lens →
output; the lens target has no depth texture). `asPixelTex` magnifies linearly with anisotropy 8, the strips 16, the
people's sheet stays nearest; `PCFSoftShadowMap`. `rvlRide.shimmer(steps, slide)` forces a 640×360 frame and reads
a 160×90 centre patch as the eye slides: 30–60 % less frame-to-frame change across facade, street, lane and skyline
views. A phone renders at half its pixels (`pixOf` → 2), carries 1500 people, 800 vehicles and half the flyers, the
people step every other frame while traffic + people cost over 14 ms (back under 7), and a lost context comes back at
the lowest tier. Calm keeps every simulation and stills only the flicker, sweep, twinkle and breathing; the tour renders
at half rate. `rvlRide.timings()` exposes the per-frame costs.

**The highway's surroundings and the intersections.** As designed: aprons as parking asphalt with an edge line,
bay lines, oil and patches; slips at grade laid a step above (y + 0.06); the yokocho under the deck (stall rows,
container stacks, a tyre shop, fuel canopies, hoardings and neon on the piers, sodium lamps every twelve). At every
junction the reach along an arm runs through the other streets at their angle (`through(o)`), so no zebra crosses
another carriageway.

**The boulevard cut → the gates on the avenue.** The diagonal boulevard was not cut. The flat, unbroken stretch the
owner named runs along the E–W tree-lined avenue, so two gate complexes straddle it at x = ±152 (`plan.gates`,
`avenueGate`): a tower on each flanking lot (stepped ziggurats west, drums with a ring east, LED edges, a beacon
each) and a bridge building over the whole avenue at 15–29 with amber-jambed portals for the roads and the median,
a giant screen on each face, a ring of glyphs turning above; the flyovers pass over at 36+, the bunting stops under a
gate. No citadel.

**Crowds and traffic.** People 3800 desktop / 1500 phone / 1400 calm, alleys ×4 and lanes ×2, knots n/32; vehicles
2000 desktop (the flow test at 2000: worst stopped 0.44–0.45, no meeting; 2100 measured 0.48, too close to the 0.5
gate) / 800 phone / 900 calm.

**Flying traffic.** Flyers 148 desktop / 74 phone in six kinds (`AirKind`: car, taxi, bus, cargo with a slung
container, drone, police; the `AIR` table gives each its build, colour, pace and lights). Sixteen lanes: the two
avenues, two rings (the second at 132), two arcs at 112–152, two patrols and eight canyon lanes. A canyon lane is a
loop along a street line — out at 46, back at 54, a unit and a half off the axis — on a height profile read every
nineteen units (the lowest clear band of twelve, read along the whole stretch and along every slope between two points,
smoothed to eight per stretch). Every candidate line (±2…±7 each way) is profiled and the four that climb the least
are kept: the built lanes stay between 46 and 66. (The first cut lifted lanes by the skyline read per eight-wide grid
cell, which carried every lane over the roofs; the second picked the least-closed lines, and a tower over a closed
segment sent one lane to 166.)

**Fireworks.** Nine sites (the stadium and a flat roof per sector, each with clear sky above); five bursts of 110
sparks in the air at most; none by day, none in calm.

**The cat.** No wide flat roof over 84 existed near the heart, so the cat sits on the megastructure's summit tier
(28 wide at 102) between its spires, facing the plaza, tail down the east wall — forty boxes, a lit green gaze that
blinks every 290 ticks, a head that turns, a tail that swishes; solid to the flight (`plan.cat`), a point of interest,
two warm spots at its feet; the hologram above lifted to 168.

**The precinct.** The stadium's base is 36 deep (the arterial's skew dips its pavement to z ≈ 152 at the east end).
The forecourt lies SOUTH of the base (the arterial runs along its north face): a lit arch, turnstiles with a gap for
wheelchairs, two ticket booths with queue rails, a food stall each end, a string of lights, a crowd zone
(`plan.plazas`); a north entrance straight off the arterial's pavement; flags on the masts. A boarding station under the
wheel with a platform, a queue between rails, a booth, a lit arch and lamps, and a crowd in the queue.

**Parkour.** `city-runners.ts`: sixty runners (34 phone, 30 calm) on `plan.roofs` — every core or outer-ring roof
six square and eight up whose top is mostly clear of kit, 461 of them; the draw favours big roofs, skyscrapers and
the heart. Acts: dance (on the beat), run (to the take-off point), leap (a gap ≤ 12, lift 2.4), thrust (≤ 60, an ember
trail), rocket (150–520 across the city, lift 30 + 7 % of the distance), land (a roll). A flight is planned against the
collision grid: take-off and landing checked apart at a radius of 0.8, the arc sampled every 1.2 units of its length at
a radius of one (a corner-cutting arc slipped between four-unit samples), lift raised ×1.5 up to twice. Three new
sprite frames (run, leap, thrust; the sheet is 88 wide, eleven frames) drawn through the runners' own instanced
geometry on the people's material; the sparks are additive points, never frustum-culled. The 6000-frame test: never
in a solid, always on a roof or an arc, every act seen, rockets fired; determinism for a seed.

**Tests.** 202 across 23 files. New: `city-runners.test.ts`; the plan's gates, cat + fireworks, roofs (> 400),
precinct and air (16 lanes, 8 canyon, 46 ≤ y < 130, > 60 % of canyon points ≤ 62, corridors clear at 1.9/2.5).
