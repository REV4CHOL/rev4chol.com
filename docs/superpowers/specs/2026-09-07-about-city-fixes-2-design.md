# About page — the city, second round of fixes (design)

Owner (2026-09-07, second message), eleven items for the about page's city, with two reference photos: a facade close-up
(speckled panes, condensers over the windows) and a six-way junction (zebras painted over each other, the boulevard's
paint running through them). Grouped by what they share, each with the decision.

## The panes and the walls (photo 1; "windows still glitching", "clipping and glitching textures across the city")

| finding | cause | decision |
|---------|-------|----------|
| speckled ("TV static") panes | the atlas paints a lit pane at 0.75–1.0 alpha (a wide one at 0.5–0.7) OVER the wall's grain and joints, so the grime shows through the light and the emissive map blooms it | every pane is painted OPAQUE; its brightness is folded into the colour (mixed toward the wall's colour, which is what the alpha did on average); the shop glass and lettering likewise |
| panes that flash as the eye moves | the dark glass is a near-mirror (roughness 0.16, metalness 0.6) of the sky dome | roughness 0.42, metalness 0.45: a soft sheen, not a mirror |
| condensers sitting on the windows | the facade kit hangs them at 1.7 up each floor — the window band | condensers hang on the SPANDREL between two floors, the family's blank band (the window's top to the next sill), sized to it; a building's family and its shopfront strip are read from its body solid |
| balconies without side rails | one rail along the front | a rail at each end too, on every balcony slab and every fire-escape platform |
| walkers that vanish and flicker far off | an eight-texel figure sampled NEAREST at a pixel or less a texel: whichever texel lands under the pixel — often a transparent one | in the sprite shader, where a pixel spans more than a texel, the figure becomes a flat capsule in its own two colours (top and bottom) at full alpha: a stable dot of the right colour at any distance; the runners share it |

## The sky

**Clouds** are world objects, not part of the camera-borne dome: two hundred flat puffs at 300–560 over a field 2400
wide, tinted by the look, fading out between 560 and 640 from the eye (the dome's radius), never drifting (the owner:
"numerous, higher up, fixed — not moving with the cursor or the altitude"). The dark low tier goes up with them (260–340).

## The ground (photo 2; "traffic lanes and pedestrian lanes design like this are atrocious")

At a junction each arm's paint sits at a REACH from the node. Today the reach is the other street's half-row plus 1.5, or
its half-carriageway over the sine of the crossing angle: at a six-way the boulevard's carriageway runs 12 units along
each road, so the roads' zebras (at 7) lie inside it and the boulevard's inside theirs — the "W" in the photo. New:

- the reach along an arm = max over the other streets of `(rowHalf(o) + carHalf(arm)·|cos φ|) / |sin φ|` + 1.5 (φ the
  angle between them, |sin φ| floored at 0.35) — the exact extent of the other's right of way along this arm; a right
  angle gives what it gave;
- the zebra centred at reach + 0.2 (past the corner, not straddling it), the stop line at reach + 1.8, the box of plain
  asphalt out to reach + 2.4 so no dash or centre line runs under a zebra;
- a node with an oblique pair (|sin φ| < 0.9) gets ONE convex-hull box over all its mouths (a star of rectangles left
  pavement wedges inside the junction); right-angle nodes keep their rectangles;
- the reach is a pure function in `city-traffic.ts` (`armReach`) with a test over every junction of the plan: no zebra
  corner inside another street's carriageway.

## The boulevard cut and THE CITADEL (owner reaffirmed the original idea)

The diagonal (x + z = −266) loses its middle: it becomes two streets, from the avenue T's to the six-ways at (−171,
−95) and (−95, −171), which become five-ways. The 2×2 block (−4..−3, −4..−3) — the diagonal crossed it corner to
corner — is reserved for the citadel, its inner crossing closed. On it: a stepped ziggurat ROTATED 45° so its faces meet
the boulevard squarely (Solid gains an optional `rotY`; the renderer rotates the instance; the grid takes the rotated
box's bounds): tiers 44 → 34 → 24 → 14 wide at 22 / 46 / 70 / 94, a crown spire to 112, a hologram ring at 120; lit
portals in the two boulevard faces (a recessed dark bay, amber jambs, lanterns), giant screens over them, a drone pad
on the third tier, LED-lit edges on the two axis-aligned annexes at the free corners (16 × 16 × 12), and a forecourt
plaza at each boulevard corner (a crowd zone, lamps, flags, a string of lanterns) where each half of the boulevard ends.
A point of interest for the auto camera.

## The ramps cut, the undercroft built

The four ramp chains go (`ramps` empty: no severed streets, no stubs, no slips): the highway is a through-route whose
traffic runs end to end past the fog, as it already does at its ends. Under and beside the deck, THE UNDERCROFT:

- the aprons (8.6 wide each side of the arterial's carriageway) are built up with INFILL UNITS between the piers — two-
  and three-storey shophouses 6–9 wide, up to 10 tall (the deck rides at 11), shopfronts to the arterial, signs,
  condensers, a stair or a ladder, a tarp roof here and there — with a gap for the yokocho stalls, a tyre shop, a fuel
  canopy every so often; none on the carriageway, none across a north–south street's band;
- under the deck, above the traffic's clearance (5.5–10.4), HANGING KIT spanning the arterial between the piers: pipe
  runs, cable trays, ducts, a mezzanine box or two, lamps, a signage gantry — the ceiling of infrastructure;
- the parked spots on the aprons go where a unit stands; the pier hoardings and neon stay.

## The highway's rails

The owner sees rails clipping across the main highway. The deck's parapets, the ramps' tapers and their parapets were the
only structures at deck level; the tapers go with the ramps. A test now samples the whole carriageway at deck height
(every 4 units, a radius of 0.3 at 2 above the deck) for solids; the pane survey covers the deck end to end.

## Parkour, more

Runners 60 → 300 on a desktop, 34 → 120 on a phone, 30 → 150 in calm; the sparks' ring 1500 → 6000. The sim's cost
per frame is asserted under a millisecond at 300 in the test.

## Testing

Plan (pure): condensers in the spandrel band for their building's family; three rails per balcony slab and platform;
two diagonal streets ending at five-way nodes; the citadel's solids (arch `citadel`) rotated, the grid solid at its
centre; no ramp; the undercroft's units (arch `undercroft`) in the apron band, none on the arterial's carriageway; the
highway's carriageway clear; `armReach` right-angle equality and no zebra corner in another carriageway. Traffic: the
graph has no ramp, the highway carries vehicles end to end. Runners: cost at 300. Renderer changes (panes, glass,
sprite LOD, clouds, junction boxes) are checked in the pane: an atlas probe (`rvlRide.atlas()`) measures the variance
inside painted panes; screenshots of a facade, a far street, the sky, a six-way and the deck.

## As built (2026-09-07, commits fb10d4f, 5980001, 1ed6ecf, 4d499aa, d1ee5be, c6c4445)

**Panes, glass, sprites (fb10d4f).** As designed. Every pane is painted opaque, its brightness mixed toward the
wall's colour; the shop glass and the lettering too. `rvlRide.atlas()` returns the painted atlas: every lit pane of the
first five families measures flat (the curtain family's panes overlap their spandrel row by design). Glass roughness
0.42, metalness 0.45. The sprite shader draws a capsule in the figure's two colours where a pixel spans more than a
texel (`fwidth` on the sheet's v).

**Condensers and rails (5980001).** As designed. The shop rule moved into the plan (`hasShop`, `NO_SHOP`), one source
of truth for the renderer's strip and the kit; `bodyOf(fp)` finds the body behind a footprint, `spandrelOf(body)` the
band. A unit sits at the band's middle (it crosses the floor line: the test wraps the modulo). Every balcony slab and
fire-escape platform carries a rail at each end. The canyon air lanes' profile now reads every 1.9 units at a radius
of 2.9 (the plan's random sequence moved and a lane grazed a block between two samples).

**Clouds (1ed6ecf).** 240 flat puffs (200 high at 300–560, 40 dark at 260–340) over a field 2600 across, world-fixed,
never drifting, tinted by the look, fading between 1100 and 1400 from the eye (the far plane is 1500; the dome writes
no depth and draws first, so a cloud past its radius still shows). Bigger and denser than the first cut (240–480 wide,
opacity 0.65–0.95) so the layer reads from the ground and from 150 up.

**Junctions (1ed6ecf, one commit with the clouds: both in `city3d.ts`).** As designed: `reachAlong`/`armReach`/
`throughReach` in `city-traffic.ts` (a near-collinear pair under 0.2 counts nothing), the zebra at reach + 0.2, the
stop line at reach + 1.8, the box to reach + 2.4, a convex-hull box (`convexHull`) at oblique nodes. Test: every
zebra corner at every junction of the plan clear of every other carriageway; the right angle unchanged.

**The citadel (4d499aa).** As designed, with these particulars. `Solid.rotY` and `solidTurned()`: the grid takes the
turned outline in BANDS across z (no band deeper than the thinner side), not one bounding box — one box the turned
square's width covered the block, forecourts and all. The portal bars are turned the other way (−π/4: along the face).
The forecourts' crowd zones sit 33 along the boulevard from the centre (the face is at 22, the block's corner at 44).
The halves end at the crossings (−171, −95) and (−95, −171): three streets each (a road is a T at the second). The
counts of holos (15), pads (7) and plazas (4) moved by one each; the flight's orbit tally became at-least-two (a rare
event across three seeds; it moved when the citadel took a block and the boulevard's middle).

**The ramps cut, the undercroft (d1ee5be).** `mergesX` is empty (no chain, no slip, no severed or stubbed street);
`portal()` lets a single link portal a lane to its own start (the highway is one link now; its lanes had no exit and its
traffic stopped at the ends — the flow test caught it). Units: 5–8.5 wide, six deep, on the line 1.3 off the edge line,
turned with the axis, two or three to a block (a block's apron between two crossings is 22.8: units stand up to the
crossing street's kerb and a hair, beside the piers), 7 or 10 tall; the aprons' parked boxes clamped to 13.4 lateral so
none pokes onto the pavement. The ceiling: on every span between two piers (14–40), pipe runs both sides with a cable
tray and LED segments, then a duct with a mezzanine box hung over the outer lane (7.3 above the road) or a signage
gantry with a screen, and four PENDANT LAMP POSTS (real practicals under the deck). The three ramp tests are kept as
`it.skip` for a plan with ramps; the traffic's ramp assertions became "no ramp, the highway carries its traffic end to
end"; the highway's carriageway is sampled clear at deck height.

**Runners (c6c4445).** 300 / 120 / 150; the ring 6000; a cost test at 300 (under 2 ms a frame in vitest).

**The highway's rails.** Not reproduced in the pane before or after: the deck was surveyed end to end at deck height
at seven stations, and from above at the rail's two crossings. The tapers and their parapets went with the ramps; the
carriageway is asserted clear at deck height every 4 units. If the owner still sees a rail across the deck, a
screenshot with the debug pose would pin it.

**Clipping and glitching textures.** Two causes found and fixed (the semi-transparent panes over the grain; the
mirror glass flashing). Close-ups of a shopfront, a facade, a junction and the undercroft show no z-fighting; not
every kind of kit was surveyed.

**Tests.** 210 across 24 files (3 skipped). Live: the site boots with the new build; the deploy runs green.

**Note.** GitHub reports the repository moved to `REV4CHOL/rev4chol.com`; pushes to the old name still redirect.

## Follow-up (2026-09-07, cb4a226): crowds where nobody would stand; pixel clouds

Owner: "random groups of NPC in illogical places (rooftop, literally in the middle of road traffic lanes)" and "clouds
should be pixels, not realistic clouds". Four causes of the crowds, all fixed:

- the market zones clustered stalls within thirty of one another ACROSS the arterial (the aprons' stalls either side),
  so a zone spanned its carriageway and its crowd milled among the buses — `marketZones` (city-people, shared with the
  test) never clusters across a carriageway; milling and placing in a zone respect roads and walls (`onRoad`, `solid`);
- a knot of talk stood on a pavement line where a cross street ran through the junction — knots retry off every
  carriageway, and nobody pauses or sits in a crossing's mouth;
- the rooftop parties' crowds — the parties keep their lights and lose their people;
- the runners danced 99 % of the time (a first choice that found no roof meant a dance) — they try the next kind of
  flight, run more, dance for a few seconds: about 60 % on the move at any moment.

The traffic's stop line is angle-aware now (`boxFor` uses `reachAlong`, as the paint does): at the boulevard's crossings
the lanes used to stop inside its carriageway. The painted zebra sits back at the corner's line, where the walkers
cross, and the stop line just past where the vehicles stop (the earlier round had moved the paint out without moving
the vehicles: they stopped on the zebras). The boulevard's crossings run longer cycles, as the arterial's do.

Clouds: a 48 × 20 bitmap of overlapping discs in three flat tones (a lit crown, the body, a dark belly, the underside
sheared flat), alpha 0 or 1, nearest magnification, near solid — six units of sky a texel on a puff 300 wide.

Tests: zones never straddle a carriageway (every zone sampled 7 × 7); nobody milling, browsing, talking, standing or
vending stands on a road (alleys and the narrow lanes excepted — a knot at a lane's edge spills a step into it, Hanoi)
or above the ground (catwalks excepted); at the oblique nodes no lane ends inside another carriageway; most of three
hundred runners on the move. 213 tests across 24 files.

## Follow-up 2 (2026-09-07, f5c4115): the window glitch was the film grain; a phone at its own pixels

Owner sent a 4K video of the live site: every unlit pane crawling with static that changed frame to frame while the
camera stood still. The atlas measures flat, the lens pass carries no grain, and at night the shadow map is off at every
tier (an A/B in the pane showed the dots identical with and without it). The dots are the SITE'S FILM LAYERS: a 1:1
noise tile re-dealt every frame and composited overlay over the whole page (hardest on mid-grey — the city's dark glass
is mid-grey; the lit panes saturate, the walls are dark, so it read as a per-pane glitch), and the scanlines banding
the panes over it. The about page now punches the layers' hole (the one the film player uses) over the whole viewport:
the city is raw glass; the chrome keeps nothing it would miss.

Mobile blur: the canvas was sized in CSS pixels over PIX with the device pixel ratio ignored — a ratio-3 phone rendered
195 wide and stretched it sixfold. A phone renders at its CSS size × min(ratio, 2) / 1.6 (about a desktop's
half-resolution pixel count), adapting to the frame (down a fifth while a render averages over 26 ms, back up under 14,
floor 0.6× CSS); rvlRide.quality() reports the scale and the buffer. Measured in the pane at 375 × 812, ratio 2:
469 × 1015, 8.5 ms a render.

## Follow-up 3 (2026-09-07, d6c86f0): the runners' pace, the sound, the cat, the tagline, the PC's pixels, the works zoom

Owner, in two messages. First: "reduce number of rooftop runners, down to 150 pls. And reduce their jumping
frequency, make it slower. Remove completely SFX from the city. Orange cat's tail is clipping through the building
its sitting on. There is a searchlight within the cat's body. REMOve it." Then: "the windows bug I talk about, fixed
on mobile, but on PC still happening (iPhone Safari; Windows PC Chrome)"; "On Mac Studio, I cannot zoom out or in in
the Works section"; "On Homepage, change AI_GENERALIST to FILMMAKER".

- RUNNERS: 150 on a desktop (120 on a phone). A leap flies at 0.14 a frame (was 0.17), a thruster hop at 0.25 (0.3);
  three choices in five plan a flight (nine in ten did); a landing runs on across the roof, and a rest of one to two
  seconds sits between runs. Measured in the sim: 5.9 take-offs a runner a minute (11.7 before — a flight every ten
  seconds, was every five), a third of the time in the air, 41 % resting. Tested (`tests/city-runners.test.ts`).
- SOUND: `city-audio.ts` and its test deleted; the renderer no longer builds or updates the beds. The site's own
  UI clicks (lib/sound) stay — they are the chrome's, not the city's.
- THE CAT'S TAIL: it clipped because its lower four boxes curled back under the roof line into the summit tier (the
  root sits 1.2 inside the tier's east face; the bends reached back 1.6 at most, and the last two curled forward), and
  the swish (about y and x) swung it further in. Now a polyline in the plan (`CAT_TAIL`, `catTailBoxes`,
  `catTailCorners`): out past the haunch, over the parapet above the roof line, straight down the wall a box's
  half-depth and a step clear of it; the swish is a swing about the tail's z — along the wall, never into it. Tested:
  every corner below the roof line, through the whole swish, clear of every solid.
- THE SEARCHLIGHT: the megastructure's summit beam stood at its old top point, under the cat's chin. The searchlights
  moved into the plan (`plan.searchlights`, the renderer sweeps them); the summit's is gone. Tested: no lamp inside a
  solid or the cat.
- THE TAGLINE: "colorist, editor, filmmaker" (site.json; the homepage's roles bar underscores it).
- THE PC'S PIXELS: the phone renders at its own pixel ratio since f5c4115 — that is why the owner's "window glitch" was
  fixed there and not on the PC. Measured on the desktop path with a pixel probe (`rvlRide.grab`): a still frame is
  clean (0 changed pixels), but a slow camera pan makes 1.3 % of the pixels on a distant tower's window grids sparkle
  — sub-pixel kit and grids at a half-resolution render with no anti-aliasing, nearest-upscaled. Four changes: the
  desktop's scene pass is multisampled (four samples, `lensTarget`); the desktop renders at min(ratio, 2) / PIX like
  the phone (PIX device pixels a render pixel, whatever the ratio); the high and ultra tiers render at PIX 1 — the
  screen's own pixels (render 1898 × 1080 at 4 ms on the owner's PC); and a tier that ran long is closed for the
  session, so the ladder never climbs back into it every dozen seconds. Debug API: `grab`, `setSamples`, `scene`.
- THE WORKS ZOOM: the floor only knew a two-finger pinch on a touch screen. Now a trackpad pinch (a wheel with ctrl
  held: Chrome, Edge, Firefox) or Safari's gesture events zoom about the cursor, a mouse wheel's notch zooms, a
  trackpad's two-finger scroll pans; the world point under the cursor holds still, as under a pinch. Tested
  (`tests/input.test.ts`, four cases).
- Not touched, noted: the megastructure's second beam floats off the second tier's corner (113, 88, −113); a stack's
  beam floats beside its chimney.
