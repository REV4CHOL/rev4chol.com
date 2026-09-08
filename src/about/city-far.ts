/** THE FAR LOD (owner: "I want the illusion of the city to be more expansive beyond the border — even from this high
 *  angle I would prefer to see the entire city still on the far horizon"; and "no matter how far I am in the map, I
 *  will always see the distant horizons in full render distance"): the rings of tiles past the full copies
 *  (city-plan's cityTiles — rings 3–7 on a desktop, 200 tiles to 5,985 from the origin; a phone's rings 2–4) carry the
 *  square's TALL masses alone, merged into one geometry a subset: the four walls of every box in one group, the
 *  roofs in another, a tint a box, the walls' UVs in window units (3 along, 3.2 up; the far skin is a tile of 8 × 8
 *  windows) with a phase a box so no two boxes light alike. The renderer wraps the arrays in three's buffers and
 *  instances each geometry over its tiles by quadrant, so a look down a street costs nothing. Pure, tested. */
import { CityTile, cityTiles, LANDMARK_ARCH, Solid } from './city-plan';
import { tintJitter } from './city-skins';

export interface FarBox { x: number; y: number; z: number; w: number; h: number; d: number }
/** A window's pitch in the far skin, world units: along a wall, and up it. */
export const WINDOW_ALONG = 3, WINDOW_UP = 3.2;
/** The far skin's tile: this many windows each way (the renderer paints it 64 × 64). */
export const TILE_WINDOWS = 8;

/** The tiles of rings `from` to `to` about the built square (city-plan's cityTiles). */
export const farRingTiles = (from: number, to: number): CityTile[] => cityTiles(to, from);

/** The masses a far ring shows: facades and cylinders (as boxes) `minH` and more high — no landmark, nothing turned,
 *  no kit, no tree. Rings 3–4 take 12 and more; rings 5–7, 24 and more. */
export function farMasses(masses: Solid[], minH: number): FarBox[] {
  return masses
    .filter((s) => (s.kind === 'facade' || s.kind === 'cyl') && !LANDMARK_ARCH.has(s.arch) && s.h >= minH && !s.rotY)
    .map((s) => ({ x: s.x, y: s.y, z: s.z, w: s.w, h: s.h, d: s.d }));
}

export interface Merged {
  position: Float32Array; normal: Float32Array; uv: Float32Array; color: Float32Array; index: Uint32Array;
  /** Group 0 the walls, group 1 the roofs (start and count in indices). */
  groups: { start: number; count: number; materialIndex: number }[];
}

/** The boxes merged: four walls a box (counter-clockwise from outside, their UVs in far-skin tiles), then a roof a
 *  box (UVs 0–1); no floor. Twenty vertices and thirty indices a box. */
export function mergeBoxes(boxes: FarBox[], rand: () => number): Merged {
  const n = boxes.length;
  const position = new Float32Array(n * 60), normal = new Float32Array(n * 60), uv = new Float32Array(n * 40), color = new Float32Array(n * 60);
  const index = new Uint32Array(n * 30);
  let v = 0, i = 0;
  const quad = (p: number[][], nrm: number[], uvs: number[][], tint: number[]) => {
    const base = v;
    for (let k = 0; k < 4; k++) { position.set(p[k], v * 3); normal.set(nrm, v * 3); uv.set(uvs[k], v * 2); color.set(tint, v * 3); v++; }
    index.set([base, base + 1, base + 2, base, base + 2, base + 3], i); i += 6;
  };
  const tints = boxes.map(() => tintJitter(rand(), rand()));
  const phases = boxes.map(() => [Math.floor(rand() * TILE_WINDOWS) / TILE_WINDOWS, Math.floor(rand() * TILE_WINDOWS) / TILE_WINDOWS]); // whole windows
  const tileAlong = WINDOW_ALONG * TILE_WINDOWS, tileUp = WINDOW_UP * TILE_WINDOWS;
  for (let b = 0; b < n; b++) {
    const { x, y, z, w, h, d } = boxes[b], hw = w / 2, hd = d / 2, y0 = y - h / 2, y1 = y + h / 2;
    const [u0, v0] = phases[b], t = tints[b], uw = w / tileAlong, ud = d / tileAlong, uh = h / tileUp;
    const wide = [[u0, v0], [u0 + uw, v0], [u0 + uw, v0 + uh], [u0, v0 + uh]], deep = [[u0, v0], [u0 + ud, v0], [u0 + ud, v0 + uh], [u0, v0 + uh]];
    quad([[x - hw, y0, z + hd], [x + hw, y0, z + hd], [x + hw, y1, z + hd], [x - hw, y1, z + hd]], [0, 0, 1], wide, t);
    quad([[x + hw, y0, z - hd], [x - hw, y0, z - hd], [x - hw, y1, z - hd], [x + hw, y1, z - hd]], [0, 0, -1], wide, t);
    quad([[x + hw, y0, z + hd], [x + hw, y0, z - hd], [x + hw, y1, z - hd], [x + hw, y1, z + hd]], [1, 0, 0], deep, t);
    quad([[x - hw, y0, z - hd], [x - hw, y0, z + hd], [x - hw, y1, z + hd], [x - hw, y1, z - hd]], [-1, 0, 0], deep, t);
  }
  const walls = i;
  for (let b = 0; b < n; b++) {
    const { x, y, z, w, h, d } = boxes[b], hw = w / 2, hd = d / 2, y1 = y + h / 2;
    quad([[x - hw, y1, z + hd], [x + hw, y1, z + hd], [x + hw, y1, z - hd], [x - hw, y1, z - hd]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], tints[b]);
  }
  return { position, normal, uv, color, index, groups: [{ start: 0, count: walls, materialIndex: 0 }, { start: walls, count: i - walls, materialIndex: 1 }] };
}
