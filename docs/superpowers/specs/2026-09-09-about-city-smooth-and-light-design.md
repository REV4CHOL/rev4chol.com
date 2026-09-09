# The city, smooth and light — design (2026-09-09)

The owner, after the far horizon shipped (`10a7179`):

1. "The entire traffic lanes in the entire city is glitching, jittering etc. Fix."
2. "I want the city optimised. Right now on my PC its playing smooth. However when I bring it to people's devices, in places where wifi signal is not good, it shutters and lagging and almost unplayable."
3. "Optimise it on mobile too. Right now on mobile its very laggy."

## What was found (measured in the pane, 1280 × 720 desktop and the phone preset)

**The jitter is the clock's.** `10a7179` gave the sims a fixed 60 Hz step by an accumulator of real time (city-clock.ts) and left the render to show whatever the last step wrote. On the owner's 120 Hz desktop a frame is 8.3 ms: the accumulator owes a step every other frame, so every vehicle, walker, runner, train and flyer advances on alternate frames against a camera that glides every frame (the rigs already move by the frame's real time). That is the strobing the owner sees on every lane. On a 60 Hz display the timer's jitter does the same now and then — a frame with no step, then one with two. Before `10a7179` the sims stepped once a frame and the 120 Hz desktop ran the city at twice its speed: the fix was right and incomplete.

**The weak PC is bound by draw calls and by fill, and the ladder cuts neither.** A desktop frame at `high` issues about 1,100 draw calls; about 1,000 of them are the smoke over the stacks and the steam from the vents (1,011 puffs, one `Sprite` and one material each, at 0.2 opacity) and the 42 tower beacons. Each call costs the CPU ten-odd microseconds in three.js: hiding the 462 sprites in view took the render's CPU side from 12.2 to 6.8 ms on the dev machine at `mid`, before the GPU drew a pixel. The tier ladder steps the pixel size, the shadows, ring 2 and the point lights down — the calls stay at ~1,090 even at `low`, and the triangles at 6.3 M (8.1 M at `high`: the far LOD's rings are 4.2 M, ring 2's full copies 1.9 M). The pane's own browser draws with a software rasteriser (a fair stand-in for a weak GPU): hiding the PBR facades took a `mid` desktop frame from 289 to 157 ms, the far LOD from 398 to 289, the points 11 ms. The "wifi" in the owner's report is the Network Information API promoting a fast connection to `ultra` at boot, on whatever GPU: ten seconds of stutter before the ladder finds a tier that fits.

**The phone pays all of the above at its own pixels** (866 calls, 4.1 M triangles at `mid`), plus a post chain of three full-screen passes (the haze's 13 taps, the bloom's five levels, the lens' 15 fetches), eight real point lights in every lit fragment at `mid`, and a render scale steered by the CPU side of the render — blind to a GPU-bound frame — so it never shrinks when the phone needs it to.

## The design

### A. The render between the steps (city-clock.ts, city3d.ts)

The sims keep their fixed 60 Hz step. Every buffer a sim writes for the GPU is a **mover**: the array itself, a copy of the last two states the sim wrote (`prev`, `cur`), the stride of an item (16 for an instance matrix, 3 for a point), where the item's translation sits in it, a snap distance, and the step numbers the two states were written at. A driver rolls its movers right after writing (`prev ← cur ← arr`, `prevStep ← curStep ← tick`); the render blends every mover into its array at the frame's time `T = tick + acc / STEP`: an item goes to `prev + (cur − prev) · a` with `a = (T − curStep) / (curStep − prevStep)` clamped to 0..1, or straight to `cur` when its translation jumped past the snap distance (a respawn, a portal at a lane's end, a flock relaunched). A buffer written every other step (the people when a frame runs long) blends over two steps by the same rule. The render is one step behind the sim, at 120 Hz it advances half a step a frame, and a stopped car does not move. Movers: the cars and their throws (matrices), the head and tail lights, the trains and their lights, the flyers and their lights, the walkers' and runners' positions, the runners' sparks, the boats and their lights, the lifts' cabs, the birds, the aircraft. Yaws, frames and colours are not blended. The far fleet's shader clock reads the same `T` instead of a per-step increment. The debug `tick()` renders at `a = 1`.

### B. One mesh of glows (city-puffs.ts, city3d.ts)

The 1,011 puffs and the 42 beacons become one `InstancedMesh` of unit quads, billboarded in the vertex shader (the instance's translation and scale kept, the quad laid across the view), the glow texture white, the tint in the instance colour, the fade in an instanced `aAlpha` attribute, the fog on (a beacon's fog at its distance is nothing). One draw call for what was a thousand. The cycle is pure: `puffPose(spec, t)` (drift, rise, size 0.6–2.8× the base, alpha 0.22·(1 − t)), `puffAdvance`, `beaconAlpha(tick, i)` (sixteen ticks on, sixteen off, offset by index), `glowSet(stacks, vents, beacons)` listing every puff and beacon with its tint. Calm stills the puffs as before; the beacons blink on.

### C. The governor (city-governor.ts, city3d.ts)

The tiers table moves out of the renderer into a pure module and grows: real point lights a tier (0 / 8 / 14 / 18), the far LOD's densities (rings 3–4 and 5–7 take masses 12 and 24 high at `high` and `ultra`, 24 and 40 at `low` and `mid`; a phone's ring 2 takes 20, its rings 3–4 take 40 — well under half the triangles). The opening tier: `high` on a desktop, `mid` on a phone or with fewer than four cores or four gigabytes, `low` under `saveData` or a 2G connection — **a connection never promotes**. The governor watches the frame interval (90 frames, the first three seconds and any frame over 250 ms excluded) and a busy figure (the steps' cost plus the render's CPU): frames over 20 ms shrink the **render scale** by a fifth (to a floor of 0.6 of the tier's size) before the tier steps down (scale back to 1, the tier above closed for the session); frames under 17.5 ms with the busy figure under 9 ms, twelve seconds after the last change, grow the scale back before the tier steps up to the ceiling. Cooldowns: two seconds after a scale change, four after a tier down. The phone's scale replaces the old CPU-timed one: the same governor, its size the phone's ceiling (`min(dpr, 2) / 1.6` of CSS) down to 0.6 of that.

### D. A phone's post chain and lights (city-post.ts, city3d.ts)

On a phone the haze pass is not added, the bloom renders at half its size (its `setSize` halved), the lens compiles without its four softness fetches (a `SOFT` define), and the point lights are 0 at `low`, 4 at `mid`. The desktop chain is unchanged.

## What does not change

The plan, the sims, the tiles, the fog of war and the far horizon; the counts (2,647 cars, 3,800 walkers, 150 runners on a desktop; 803 / 1,783 / 70 on a phone); ring 1 at every tier; the poster-lock; calm; `about-old.html`.

## Tests

- city-clock: a mover rolled and blended — a 120 Hz frame stream (8.33 ms) advances the render by half a step every frame with no zero and no double; a jittered 60 Hz stream (16.2 / 17.1 ms) within a tenth of a step a frame; a two-step cadence blends over two; a respawn snaps; a stopped item stays; the first frame shows the start.
- city-puffs: the set's size (1,011 + 42), a puff's pose along its cycle, the beacon's blink.
- city-governor: the opening tier by device (a fast connection does not promote); long frames shrink the scale before the tier; the closed ceiling; short frames with headroom climb the scale first; a phone's bounds; the cooldowns.
- city-far: the sparse densities are fewer and taller.
- city-post: the lens without softness compiles the define.

## Verification in the pane

`rvlRide.info()` (new: the frame's draw calls and triangles across every pass) before and after: calls ~1,100 → ~110 at `high`; triangles at `low` 6.3 M → ~3.7 M; a screenshot of smoke over a stack and steam over a vent; the beacons blinking; `rvlRide.tick(60)` and the clock test for the 120 Hz stream (the pane throttles `requestAnimationFrame` to one frame every two seconds between tool calls, so no live frame rate can be read here).

## Later

A real phone in hand (the pane's software rasteriser is a stand-in); a Lambert variant of the facade skin for the lowest tier; the people's and traffic's counts by tier.

## As built (2026-09-09)

- **The movers** roll inside each driver (the cars, boats, trains, cabs, walkers, runners and their sparks, birds, aircraft, flyers) and blend in `render(alpha?)`; the debug `tick()` renders at `a = 1`. The clock's state (`acc`, `stepCost`) moved beside `tick` — a `let` after `render()` throws at boot. The far fleet's clock is `T / 60`. The roll costs the traffic's step about half a millisecond on the dev machine (2,647 cars, two matrix buffers and two point buffers).
- **The glows**: 1,053 sprites became one instanced mesh; five sprites remain (the nebulae, the sun, the moon). The pane counted the sprites in view at the tour's pose at about 840 of the 1,105 calls — more than the 462 of the first estimate.
- **Two merges the spec did not name**, once the sprites were gone the census showed them: the 73 giant screens (a mesh, a material, a canvas and an upload each, every six ticks) are one mesh over one 256 × 200 atlas, painted and uploaded once; and static furniture is merged by material through `mergeStatic(scene, parts)` — the searchlight mounts' decks, rails, rungs and rings (the yokes and drums keep turning), the stallion's thirty boxes (bronze and stone), and every box added straight to the scene under a plain Lambert (the bridges' pylons, stays, walls, piers and poles, the canal's ends). The rule that makes the last one safe: whatever moves lives in a group or an instanced mesh; a bare Lambert box on the scene is furniture.
- **The governor** caps a phone's ceiling at `mid`; `PHONE.lights` is indexed safely when the debug `setQuality` forces a higher tier.
- **Measured** (the pane, 1280 × 720, the tour's opening pose, steady frames; the software rasteriser's tier steps are ignored by forcing tiers):

| tier | draw calls before → after | triangles before → after | real lights |
|---|---|---|---|
| ultra | 1,342 → 455 | 8.49 M → 8.12 M | 18 |
| high | 1,105 → 455 | 8.12 M → 8.12 M | 14 |
| mid | 1,087 → 437 | 6.26 M → 4.55 M | 8 |
| low | 1,087 → 437 | 6.26 M → 4.55 M | 0 |

The render's CPU side at `high` (1898 × 1080) on the dev machine: 14.5 ms → 6.4 ms a frame. Plain meshes in the scene 613 → 186 (of which 120 static boxes and 73 screens were merged, 1,053 sprites replaced). The far LOD at `low`/`mid`: rings 3–4 at 24 (1,364 boxes a tile) and rings 5–7 at 40 (611) in place of 12 (4,033) and 24 — 1.7 M triangles fewer.
- **The phone preset** (375 × 812 at a ratio of 2, the tour's opening pose): draw calls 866 → 381 at `mid` and `low`; triangles 4.10 M → 3.58 M (ring 2's stand-in at 20 over 16 tiles, rings 3–4 at 40 over 56); real lights 4 at `mid`, 0 at `low`; the render's CPU side 7.5 → 2.7 ms at 469 × 1015; the counts 803 / 1,783 / 70 as before. Under the pane's software rasteriser the governor had already shrunk the phone's scale from 1.25 to 0.8 of CSS by the time it was read — the frame-interval steering works on the phone path.
- **Not done here**: a real phone in hand (the pane's rasteriser is a stand-in for a weak GPU, not for a phone's CPU), and the jitter itself cannot be watched in the pane (its `requestAnimationFrame` runs at one frame every two seconds between tool calls) — the 120 Hz stream is proven by the clock's tests.
