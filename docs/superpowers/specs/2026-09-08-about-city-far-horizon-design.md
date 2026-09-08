# The About city: the far horizon, the corridor, the highway's own traffic, the sun at infinity, the pace; the phone; the music on a phone

**Date:** 2026-09-08 · **Status:** approved (autonomous mode: the owner's twelve points are the brief) · **Owner's words:**

> 1. During other times of day other than Night, there is a lot of out-of-place glow that follows whenever my camera
> goes. FIX. 2. Don't like this spot that is located outside the border (reference photo 1). The road looks too ugly.
> Fix. 3. Change SND to SFX. 4. Infinite highway: vehicles should not disappear on the two ends. They must continue
> seamlessly. 5. The parkour runners' speed should be slower by 50%, especially during their flight. 6. Beyond border:
> I want the illusion of the city to be more expansive beyond the border (it's an illusion so you must try to trick the
> audience, and also to optimise our performance). Like even from this high angle (reference photo 2), I would prefer
> to see the entire city still on the far horizon, not empty like this. 7. Also beyond border, I want the far view of
> the city to always be in my view, not render along with my camera because it breaks immersion. Like no matter how far
> I am in the map, I will always see the distant horizons in full render distance. 8. Autofly: when pressing AUTO, don't
> make the camera have sudden movements (teleport, etc.) at the start like that, it startles the audience. 9. Make
> traffic move 40% slower. 10. Re-organise the times of day layout as DAWN DAY HAZE DUSK NIGHT. 11. Mobile: when
> changing sections, music stops playing and needs to be manually re-enabled again. FIX. 12. Mobile: in the About
> section, the city has big bugs. It seems to move in slow motion, and laggy. FIX.

## What is wrong today (measured on the pane, desktop path, unless said)

1. **The daylight glow.** The sun is a soft disc sprite 600 from the eye in the sky group that rides the camera, drawn
   with the depth test: towers nearer than 600 hide it, towers farther do not, and as the camera moves the disc holds
   its place on the screen while the far skyline slides behind it — at dusk (5.5° up, 70 across) it is an orange blob
   standing before the far city (two frames 60 apart: the blob at the same pixel, the towers moved). The moon is the
   same kind of sprite at 561. The night has no sun, so the night is clean.
2. **The ugly road (photo 1)** is the endless highway's corridor through the tiles. A copied mass is dropped whenever
   its centre comes within ROW + half its size + 1 of the highway's line — a whole lot for a corner's overlap — so a
   bare band up to a lot wide flanks the arterial's strip on both sides; the copied grid streets' strips and their
   far-traffic lanes run straight on under the deck and across the arterial's carriageway (crosswalks under the
   viaduct); nothing lines the corridor as the arterial is lined inside the square.
3. The HUD says SND.
4. **The highway's ends.** The sim's highway is the square's 800: at ±400 its lanes portal (a vehicle at the end is
   carried to the other end in a step). The continuation's traffic is the far fleet's: GPU-driven lights and bodies
   evenly spaced on lanes that start exactly at the portal. At each end a real vehicle vanishes and a fleet vehicle
   appears out of the seam, in plain view from the fence.
5. RUN_V 0.14, LEAP_V 0.14, THRUST_V 0.25, ROCKET_V 0.75 a frame.
6. / 7. **The far horizon (photo 2).** The fog of war is 0.985 nine hundred out of the fence; the far-plane fade takes
   the rest at 1,050–1,450 from the eye; the far plane is 1,500; ring 2 ends at 1,995 from the origin. From the tour's
   terminus (132 up) or the free rig's ceiling (220) the beyond is a flat plane of the fog's colour with a wall of dark
   silhouettes where the tiles stand at 98.5 % fog, then the dome. The camera fog (0.0007–0.0009 × the look) is 0.67
   at 1,500 and 0.99 at 3,000 from the eye: whatever stood farther would be lost with the eye's distance anyway — the
   "renders along with my camera".
8. **AUTO.** The camera's body (lerped a tenth a frame toward the flight's point) is seated once (`bodied`) and never
   again: the second AUTO of a visit starts from the last flight's final position and glides across the city to the new
   one — measured: a warp to (120, 40, −60), then AUTO, and the first frame is at (−76, 31, 40), two hundred away. The
   eye's aim is stale the same way, and the flight is at full pace on its first frame.
9. SPEED highway 1.9, ramp 1.3, arterial 1.25, lane 0.6, roads 1; SPEC base speeds 0.085–0.15 a frame; the far fleet
   SPD road 12–17, highway 24–31, arterial 16–21, lane 7–10 a second (twice the sim's); the flyers 0.4–0.42 × pace.
10. TIMES = night, dusk, dawn, haze, day.
11. **The music on a phone.** Each section is a new document. Chromium carries the user's activation across a
    same-origin navigation, so the head boot's `play()` succeeds; iOS Safari does not: every new document needs its own
    gesture before it may sound. On iOS the boot's `play()` is refused and the module waits for a gesture; the shell
    wires pointerdown (not an activating event for touch, per the HTML spec), keydown and touchend; a tap on the
    loading screen — before the module loads — is lost; and MUS pressed while the music silently waits turns it OFF
    (the toggle flips `enabled`), so it must be pressed twice: the "manually re-enable".
12. **The phone.** Every sim steps once a rendered frame (traffic, people, runners, flyers, the far traffic's clock, the
    flight's pace): at 20 fps the city runs at a third of its speed — the slow motion. The laggy is the load: ring 1's
    full copies, 800 vehicles with their throws, 1,500 walkers, 120 runners, the far fleet's lights, three post passes.

## The design

### 1. The sun and the moon at infinity
Both sprites move out to 6,000 from the eye (still in the sky group), scaled × 10 so they subtend what they did; the
far plane (6–7) reaches past them. Every tower, near or far, now stands before them, and no glow hangs before the
skyline. The dome's warm lobe about the sun stays: it is the sky.

### 2. The corridor through the tiles
- **An exact cull:** a copied mass or filler box is dropped only if its footprint (axis-aligned in the world — the
  tiles turn by quarters) reaches inside the right of way (ROW + 0.5), not its centre plus half its size plus one.
- **Corridor filler:** along both sides of the corridor where it runs through the tiles (from the square's edge to the
  tiles' edge, both ways) stand boxes with their inner face on the building line (ROW + 0.8): 9–20 along, 8–14 deep,
  10–40 high (a spike now and then), turned to the corridor's angle, skinned from the tiles' stream in the ordinary
  textures, each placed only where its footprint clears every copied mass and filler kept (an AABB test in the world),
  gap-free along the line. Ring by |x|. The arterial through the tiles is lined like the arterial inside.
- **The copied streets stop at the corridor:** a copied road or lane crossing the highway's line is laid in two pieces
  ending at the building line (ROW + 1 over the sine of the crossing angle); one lying inside the right of way and
  near-parallel is not laid; the far fleet's lanes follow the same pieces. (The copied glow and junction paint in the
  corridor were skipped already.)

### 3. SND → SFX
The sound-effects button reads SFX (id `hud-snd` kept), titled "Sound effects: on / off"; comments follow.

### 4. The highway's own traffic, end to end
The plan's highway street and the arterial street run HW_FAR (1,600) past each end of the square — one street each,
4,000 long — so the sim owns the continuation: its vehicles drive off the square onto the far deck and portal only at
the far ends, 1,700 out of the fence, where the fog of war is 0.86 and a car is a pixel. The continuation's vehicles
come on top of the city's: `populate` runs a second time weighted by the continuation lanes' lengths alone — 700 on a
desktop (one per 45 lane-units, the far fleet's density), 260 on a phone. The far fleet's continuation lanes go. The
renderer's deck, parapets, edge lights, tubes and arterial strip follow the streets' own lengths (the separate far
deck boxes and far arterial strip go; the far piers, caps and lamp heads stay). The plan's dressing of the highway
(deck solids for the flight, gantries, parapet lamps, piers) keeps to the square; the arterial's `ends` pads grow with
it so its walkers still turn at the rim.

### 5. The runners at half pace
RUN_V 0.07; LEAP_V 0.07, THRUST_V 0.125, ROCKET_V 0.375; the shortest flights 64 / 144 / 400 frames. The pace test's
bounds follow the owner's new pace (flights come about half as often, last twice as long).

### 6–7. The far horizon
- **The fog of war never closes:** `beyond = 0.85 · smoothstep(0, 900, d) + 0.15 · smoothstep(900, 6000, d)` — 0.85 at
  ring 1's far edge, 0.88 at ring 2's, 0.93 at 3,000, 1 at 6,000. The far city is a dim carpet with its lights pricking
  through, never a void.
- **The beyond has the sky's colour.** A uniform `uBeyond` — the look's dome sampled at the horizon band (v = 0.515, no
  lobe), blended with the looks — replaces the fog colour as the beyond rises, `mix(fogColor, uBeyond, smoothstep(0.3,
  1.0, beyond))`, in both fog forms. The far city dissolves into the sky's band and the ground's far edge meets the
  dome in its own colour: no line. Every fog-lit material takes the uniform through `Material.prototype.onBeforeCompile`
  (the materials with hooks of their own — the skin, the additive-fog decals, the far fleet, the billboards, the
  people — add it themselves).
- **The far plane is 20,000** at every tier; the far-plane fade moves to 16,000–19,000 (a last resort). The camera fog
  thins to a third (TIERS fog 0.00025–0.0003; HAZE's multiplier 3 → 5 keeps the hazy morning white): 0.13 at 1,500 from
  the eye, 0.79 at 5,000 — the beyond is the world's, not the eye's. The ground plane grows to ±16,000.
- **The far LOD (city-far.ts, pure, tested).** Rings 3–7 (24 + 32 + 40 + 48 + 56 = 200 tiles, to 5,985 from the origin)
  are built from the square's masses — facades, cylinders (as boxes) and filler 12 and more high in rings 3–4, 24 and
  more in rings 5–7 — merged into one BufferGeometry a subset (walls in one group, roofs in another; per-vertex tints;
  wall UVs in window units, 3 along and 3.2 up, with a random phase a box) and instanced over the tiles by quadrant
  and ring group: eight InstancedMeshes (four quadrants × near / far), each frustum-culled as a whole, so a look down a
  street costs nothing. The walls' material is a Lambert with a generated 64 × 64 far-skin tile (8 × 8 windows, a
  third lit, warm and cold) as map and emissive map; the look drives its colour (toward the bleach colour by the bleach
  amount) and its emissive (the windows' level); the roofs are the dark material. Fog-lit like everything (the fog of
  war, the haze pass). At the tiers below high, ring 2 is LOD too (a ninth mesh, shown when the full ring 2 is
  hidden); a phone builds rings 2–4 as LOD beside its full ring 1.
- **The clouds** become eight merged meshes (one a texture) over a field of radius 3,000 at the same density (about
  1,280 puffs), fog-lit so the far ones dissolve into the beyond, with no per-frame distance fade.
- "Always in view": nothing beyond the fence is faded, culled or gated by its distance from the eye any more; the fog of
  war is a function of the place, and the far plane is out of reach.

### 8. AUTO without the jolt
Entering AUTO: the body is re-seated on the camera, the eye's aim is the camera's own look point, the flight's pace
ramps from a tenth to full over 150 frames (an ease-in) and the pan's rate ceilings ramp the same way.

### 9. Traffic at 60 %
`PACE = 0.6` in city-traffic.ts scales every link speed (the SPEED entries and the roads' 1); the far fleet's SPD
matches the sim's real speeds after the pace (road 4–6, lane 3–4 a second; the highway's and arterial's lanes are the
sim's now); the flyers' lane speeds × 0.6. The signals' timings stay: a box still busy holds the next green.

### 10. The clock's order
TIMES = dawn, day, haze, dusk, night; T cycles in that order; the About page opens at night as before.

### 11. The music on a phone
- The head boot listens for the page's first activating gesture — `pointerup`, `touchend`, `click`, `keydown` — from
  its first line and calls `play()` inside the handler (a tap on the loading screen counts; iOS wants the call inside
  the handler).
- The module's gesture wiring adds `pointerup` and `click`; MUS pressed while the music is on but silent (refused,
  waiting) starts it instead of turning it off.
- The honest limit: iOS Safari grants no sound to a document before a gesture on it. With this, the first touch
  anywhere — a scroll, a tap, the swipe on to the next section — brings the music back at once, from the first paint.
  A soft navigation on phones (the next document written into this one, the audio element kept) is the only way past
  the limit; it is a separate piece of work (below).

### 12. The phone
- **A fixed-step clock.** The world steps at 60 Hz by an accumulator: a frame runs floor(acc / 16.67) steps, at most
  three, and at most what the last steps' cost allows (`stepsAllowed(acc, cost)` in city-clock.ts, pure, tested: a
  step costing over 9 ms allows one a frame, over 5 ms two, else three) — a slow phone runs the sims at real time when
  its CPU can and degrades gracefully when it cannot; a 120 Hz desktop no longer runs the city at twice its speed. The
  camera rigs advance by the frame's real time (the flight's distance and the free rig's velocity scale by dt / 16.67,
  capped at three).
- **Less on the phone:** walkers 1,500 → 900, vehicles 800 → 550 (+ 260 on the continuation), runners 120 → 70; the far
  LOD's rings 2–4 where nothing stood; the rest as it was (ring 1 full, lights only, the adaptive render scale).

### Later (its own spec): the soft navigation on phones
On a coarse pointer, `leaveTo` and the glide's commit fetch the next page's HTML, dispatch a teardown the current page
answers (the city's loop and renderer, the works world, the reel), write the document in place (`document.open /
write / close` — the Window and the detached audio element live on), bust the page module's URL so it re-evaluates,
push the new URL. Not in this build.

## Not changed
The looks' colours and domes, the fence, rings 1–2's full copies at the high tiers, the canal's end, the tiles' filler,
the real traffic's rules and signals, about-old.html.

## Verification
tsc, vitest, vite build; the pane (desktop path, 150 runners): dusk with a tower before the sun (the disc hidden), the
corridor from the fence (lined, no bare band, streets ending at the building line), the far horizon from 220 and from
the tour's terminus (city to the horizon, no silhouette wall, no line), the highway's end from the fence (vehicles carry
on), AUTO twice from FREE (a first-frame move under a unit), timings at ultra; the phone path (the pane's mobile preset):
runners 70, cars about 810, the LOD rings present; the boot snippet's listeners in its test; the live site after deploy.
