# The fog of war, natural; the searchlights' mounts — design

**Owner:** "build something to attach these searchlights in a logical way" and "I still need the fog of war and
distance blur beyond boundaries. Design it in a very natural and seamless way."

**Date:** 2026-09-07. Autonomous mode: the design is chosen and recorded here, the build follows in the plan.

## The fog of war, natural

What it was: a wall in world space — 97.5 % fog past 400 from the origin, whatever the distance — removed with
the endless city (`2026-09-07-about-city-endless-design.md`), which left only the distance fog and a full fade
before the far plane. The owner wants the fog of war back, natural and seamless, and a distance blur with it.

Approaches weighed:

1. **A distance fog thick enough to own the beyond.** Moves with the eye: the same block is clear from the fence
   and lost from the plaza, which the owner rejected once already ("no fog wall that moves with the eye").
2. **The old wall, softened.** Still a band standing in the world at one place; from the air it reads as a ring.
3. **A gradient out of the fence** (chosen): the fog of war is a function of how far OUT of the fence's square a
   point lies — zero inside, rising smoothly to near total nine hundred units out, the square's corners rounded
   (the distance to the square, not to its centre). It stands in the world like the wall did, so nothing moves
   with the eye, but it has no edge: the outer ring is clear, the first ring of tiles is glimpsed through
   thickening fog, the second dissolves. The far-plane fade stays as the last resort.

The distance blur: a haze pass after the scene pass, before the bloom. Every opaque material writes its own
fog-of-war amount into the frame's alpha (the fog chunk the renderer patches into every material does it, under
three's `OPAQUE` define, so blended things keep their alpha); the pass blurs each pixel over a Vogel disc of
twelve taps by its own amount, weighting each tap by its own amount against the centre's, so the sharp city
never smears into the haze and the haze never bleeds into the city. Radius about 0.65 % of the frame's height at
full amount. The bloom then blooms the softened far lights softly.

## The searchlights' mounts

Every searchlight stands on something now, and every one has a fixture: a drum that turns with its beam (the
lens face lit in the beam's colour), on a yoke that turns with the sweep, on a pivot on a railed deck. The deck's
top sits 1.6 below the lamp. Three mounts:

- **`top`** — the deck on the top of a mast that stands already: the stadium's two lit masts (their lamps now
  1.6 above the mast tops).
- **`mast`** — a lattice mast from a base up to the deck: the megastructure's second beam, which floated off the
  second tier's corner, moves onto that setback's north-west corner (base 74, the lamp where it always was, 88);
  the wheel's beam, which floated above the rim's crown, moves onto a mast from the ground west of the rim (base
  0, the lamp above the crown).
- **`ring`** — a railed maintenance ring about a stack six below its crown, the lamp on the ring: the stack's
  beam, which floated beside its chimney.

Tests: every lamp clear of the solids (kept); a `mast` base on a solid or the ground; a `ring` about a solid at
its height, the lamp within its radius; a `top` on a solid just below its deck.

## As built

Commit e7402ca, 2026-09-07. Built as designed.

- The fog of war: `beyond = smoothstep(0, 900, length(max(|xz| − 280, 0)))`, `fog = max(fog, 0.985 · beyond)` in both
  fog-chunk forms; the mixed form writes `alpha = 1 − beyond` under three's `OPAQUE` define. From the fence the copied
  avenue thickens into the fog colour by its far end; from the air the tiles dissolve into a haze band.
- The haze pass: twelve Vogel taps, radius 0.65 % of the frame's height at full amount, weighted by each tap's own
  amount against the centre's; after the scene pass, before the bloom. 4.1 ms of render at the high tier with it.
- The mounts: the stadium's two masts carry a deck and a drum on their tops (the lamps 1.6 above the mast tops);
  the megastructure's second beam stands on a lattice mast on the second tier's north-west corner (base 74, lamp
  88); the wheel's beam on a lattice mast from the ground west of the rim (lamp 27); the stack's on a railed ring
  about the chimney six below its crown. Every drum turns with its beam and its yoke with the sweep. Tested: every
  lamp clear; a top on a mast that stands; a mast's base on a roof or the ground with its run in the open; a ring
  about a solid with the lamp within it.
