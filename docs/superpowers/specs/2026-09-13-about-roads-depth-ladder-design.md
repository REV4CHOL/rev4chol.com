# The roads' depth ladder — design (2026-09-13)

The owner, after the movers shipped (`25faa9c`): "traffic lanes and road around the entire city are still flickering."

## What was found (measured in the pane, 1,265 × 720, `high`, night)

The first fix was the clock's and it held — vehicles no longer strobe. What still flickers is the **paint itself**: the road strips against the ground, and the junction boxes against each other, everywhere the eye is more than a few hundred metres from the tarmac.

**The arithmetic.** The camera's near plane is 0.5 and the depth buffer holds 24 bits, so the smallest depth step the buffer can tell apart at distance `d` is about `d² / (0.5 · 2²⁴)` — 4 cm at 600 m, 24 cm at 1,500 m, 48 cm at 2,000 m. The grid strips lie **4.4 cm** over the ground, the junction boxes **2 mm** over each other. Since `10a7179` (far plane 1,500 → 20,000, fog a third of what it was, the ground to ±16,000, strips through rings 1–2 to ±2,000), roads are *visible* far beyond the 600 m where their height stops meaning anything to the buffer. Two different triangles in the same quantum round differently pixel by pixel, and the rounding pattern slides as the camera moves: the winner flips frame to frame. That is the sparkle on every distant carriageway.

**Measured.** Two renders at the same pose differ in zero pixels (the frame is deterministic). Nudge the ground back by two depth quanta and count the pixels that change winner — pixels the buffer is *deciding by a coin toss* today:

| pose | tie-decided pixels | where |
|---|---|---|
| aerial (0, 150, 280 · π · −0.22) | 1,878 | the mid-distance rows, exactly the receding roads |
| street (19, 14, 300 · π · −0.12) | 16 | the horizon slit |
| avenue (11, 5, −150 · π · −0.4) | 441 | every distance band |

The strips already carry `polygonOffset` rungs against **each other** (0 / −1 / −2 / −3, the arterial −5, the boxes −6, the zebras −8, the stops −9) — that is why road-over-road holds. The two missing rungs: the **ground and the patches have none** (rung 0, tied with the x-axis strips), and the **junction boxes share one rung** while overlapping each other 2 mm apart in every crossing's centre square (ties past ~130 m, different UVs on the same asphalt, so the tie is visible noise). The light decals (headlight throws, lamp pools, shop spill) sit at −2, *behind* the crossing paint they cross — a cone loses its pixels to a stop line past ~640 m.

## The design

One pure module, `city-paint.ts`: **the ladder** — every flat paint's `polygonOffsetUnits`, greater pushed behind, lesser pulled in front. The offset, not the height, names the winner at every distance; the heights stay as belt near the camera.

| layer | units |
|---|---|
| ground | **+6** (factor +1) |
| patches | **+3** (factor +1) |
| road strips x / z | 0 / −1 |
| lane strips x / z | −2 / −3 |
| the boulevard | −4 |
| the arterial | −5 |
| junction boxes, a rung a street | −6 / −7 / −8 |
| zebras | −10 |
| stop lines | −11 |
| light decals (throws, pools, spill) | −14 |

- **The ground and the patches** push back (positive factor: parallel planes share their slope, so the factor term only widens the margin at grazing angles). Patch-over-patch ties stay invisible — one flat colour, no map.
- **The junction boxes** split into three instanced meshes, one per street rung (`i` capped at 2, the third rung with room for a fourth street); the oblique hull keeps rung 0. Same look, no shared-rung overlap anywhere.
- **The decals** move to −14: in front of the deepest opaque paint (stops, −11) by 3 everywhere. They are faint additive light; the quanta they jump are centimetres at street range.
- Margins ≥ 2 quanta between any two layers that can overlap; ≥ 3 across the families.

## What does not change

The strip heights and textures, the junction geometry, the zebra/stop placement, the shadows, the far LOD, `about-old.html`, the poster-lock, calm.

## Tests

city-paint: the ground behind every paint and the patches between; the strips, the boulevard, the arterial and the boxes descend in stacking order with the three box rungs above the zebras; the zebras and stops clear the deepest box by ≥ 2; the decals clear everything by ≥ 2.

## Verification in the pane

The same tie count at the same three poses with the same ±2 nudge: expected ~0 (every margin ≥ 3). The sub-pixel slide flip count (0.02 sideways, |Δ| > 24) before → after at the aerial and avenue poses: the tie share gone. Screenshots at both poses: same picture, junction paint intact, cones and zebras whole. The phone preset boots and looks the same.

## As built (2026-09-13)

- The ladder went in as specced. `streetMat`, `layStrips` and `laidRoad` now take real GL units (≤ 0 pulls, callers name their `PAINT` rungs); the junction boxes are three instanced meshes — rung −6 carries 4,066 boxes, −7 carries 4,065, **−8 carries none**: no crossing in this plan has a third box street (the oblique boulevard crossings take the hull at rung 0), so the third rung is head-room.
- **The tie probe after** (the ground nudged +2 quanta, 1,265 × 720, `high`, night): **0 / 0 / 0** tie-decided pixels at the aerial, street and avenue poses — 1,878 / 16 / 441 before. Nudging the whole crossing family (every material at −6 or deeper) by −2 moved 28 / 0 pixels — silhouette reordering against real geometry at extreme range, not ties (no margin shrinks below 2).
- **The slide metric did not move** (aerial 12,783 → 12,776) and that is the honest reading: it counts every |Δ| > 24 under a 2 cm slide — MSAA edges and window lights across the whole frame — so the tie noise was always its road-band minority. The tie probe is the causal measure and it reads zero.
- Screenshots at the aerial and avenue poses match the before pictures — boxes, zebras, stop lines, lamp pools, headlight cones all whole. The phone preset boots `mid` at 469 × 1015 with the full crossing family (14 meshes) and the same paint.
- The subway stairs keep their −2: they lie on the ground alone, eight rungs of margin under the new floor.
- Pane lessons: the pane can close between tool calls — every measurement must ride one `browser_batch` with `preview_start` fresh before it; and a screenshot right after a same-batch render shows the *previous* presented frame — `wait` 2 s first (`grab()` reads the framebuffer synchronously and never lies).
