/** THE PAINT LADDER (owner: "traffic lanes and road around the entire city are still flickering"):
 *  every flat paint on the city's floor names its rung — `polygonOffsetUnits`, greater pushed
 *  behind, lesser pulled in front. The heights (the strips 4.4 cm over the ground, the boxes 2 mm
 *  over each other) place the paint near the camera; past a few hundred metres a 24-bit depth
 *  buffer at near 0.5 cannot tell them apart (its smallest step is ~d²/(0.5·2²⁴): 4 cm at 600 m,
 *  half a metre at 2,000) and two triangles in the same quantum round differently pixel by pixel,
 *  flickering as the eye moves. The rung decides the winner at EVERY distance; margins of two or
 *  more quanta absorb the rounding. The ground and the patches take a positive factor too:
 *  parallel planes share their slope, so the factor only widens the margin at grazing angles. */
export const PAINT = {
  ground: 6, //    the ground sheet, behind every paint
  patch: 3, //     the lots' stone over closed street bands: over the ground, under all paint
  roadX: 0, //     the grid roads' strips, east–west
  roadZ: -1, //    …north–south, in front where the axes cross
  laneX: -2, //    the lanes' strips
  laneZ: -3,
  boulevard: -4, // the diagonal's carriageway
  arterial: -5,
  junction: -6, // the crossings' asphalt boxes: a rung a street (−6, −7, −8 — the boxes of one
  //               crossing overlap in its centre square, so each takes its own)
  zebra: -10, //   over the deepest box by two
  stop: -11, //    the stop lines (opaque: they write depth, so the decals must clear them too)
  decal: -14, //   every light lying on the paint — headlight throws, lamp pools, the shops' spill
} as const;
