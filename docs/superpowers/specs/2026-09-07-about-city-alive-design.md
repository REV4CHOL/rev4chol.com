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
