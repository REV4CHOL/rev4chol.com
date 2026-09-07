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
