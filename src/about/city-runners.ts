/** PARKOUR (owner: parkour hip-hop artists on the rooftops around the city, flying and doing insane parkour, some with
 *  self-propelled rockets across the whole city; on the skyscrapers too) — a sim of RUNNERS on the flat roofs. A
 *  runner dances on a roof, runs its length, LEAPS the gap to a roof within twelve (real parkour: a run-up, a jump, a
 *  roll on landing), crosses a gap up to sixty on THRUSTERS (a steep arc, a flame trail) and, now and then, ROCKETS
 *  right across the city to a far roof, high over everything. Every arc is sampled against the city's solids and
 *  raised until it clears them; a runner is always on a roof or on an arc between two roofs. */
export interface Roof { x: number; z: number; w: number; d: number; top: number }
export type RunAct = 'dance' | 'run' | 'leap' | 'thrust' | 'rocket' | 'land';
export interface Runner {
  x: number; y: number; z: number; yaw: number;
  act: RunAct; frame: number;
  /** The roof stood on (or left), the roof bound for, the arc's ends and its lift, the arc's progress and length. */
  roof: Roof; to: Roof | null; from: [number, number, number]; dest: [number, number, number]; lift: number; t: number; T: number;
  /** The spot being run to on the roof; frames left in the act; a personal phase for the animation. */
  tx: number; tz: number; timer: number; phase: number;
  /** How many flights (thrusts and rockets) this one has made. */
  flights: number;
}
/** The sprite frames the runners use beyond the walkers' (the sheet carries eleven). */
export const RUN_FRAME = { walkA: 0, walkB: 1, stand: 2, talk: 4, run: 8, leap: 9, thrust: 10 } as const;
export interface Solids { hit(x: number, y: number, z: number, r: number): unknown }

const LEAP = 12, THRUST = 60, ROCKET_MIN = 150, ROCKET_MAX = 520;
const RUN_V = 0.14;

/** The axis-aligned gap between two roofs' footprints (negative where they overlap). */
export const roofGap = (a: Roof, b: Roof): number => Math.max(Math.abs(b.x - a.x) - (a.w + b.w) / 2, Math.abs(b.z - a.z) - (a.d + b.d) / 2);

export class Runners {
  readonly runners: Runner[] = [];
  /** The thrusters' sparks: a ring of positions, colours and lives (the renderer draws them). */
  readonly trail = { n: 6000, pos: new Float32Array(6000 * 3), col: new Float32Array(6000 * 3), vel: new Float32Array(6000 * 3), life: new Float32Array(6000), head: 0 }; // (three hundred runners: four times the sparks)
  tick = 0;
  rockets = 0;
  private readonly roofs: Roof[];
  private readonly cells = new Map<string, Roof[]>();

  constructor(roofs: Roof[], private readonly solids: Solids, private readonly rand: () => number, n: number) {
    this.roofs = roofs.filter((r) => r.w >= 6 && r.d >= 6 && r.top >= 8);
    for (const r of this.roofs) { const k = this.cellOf(r.x, r.z); const l = this.cells.get(k); if (l) l.push(r); else this.cells.set(k, [r]); }
    for (let i = 0; i < n && this.roofs.length; i++) {
      const roof = this.draw(this.roofs);
      const spot = this.spotOn(roof);
      const r: Runner = {
        x: spot[0], y: roof.top, z: spot[1], yaw: rand() * Math.PI * 2, act: 'dance', frame: RUN_FRAME.stand,
        roof, to: null, from: [0, 0, 0], dest: [0, 0, 0], lift: 0, t: 0, T: 1, tx: spot[0], tz: spot[1], timer: 60 + rand() * 300, phase: Math.floor(rand() * 60), flights: 0,
      };
      this.runners.push(r);
    }
  }

  /** A roof's draw: the big roofs and the skyscrapers draw the runners, the heart of the city more than its edge. */
  private static weightOf(r: Roof): number { return Math.sqrt(r.w * r.d) * (r.top > 60 ? 1.6 : 1) / (1 + (Math.hypot(r.x, r.z) / 260) ** 2); }
  /** One of the roofs, drawn by weight. */
  private draw(list: Roof[]): Roof {
    let total = 0;
    for (const r of list) total += Runners.weightOf(r);
    let pick = this.rand() * total;
    for (const r of list) { pick -= Runners.weightOf(r); if (pick <= 0) return r; }
    return list[list.length - 1];
  }
  private cellOf(x: number, z: number): string { return `${Math.floor(x / 60)}:${Math.floor(z / 60)}`; }
  /** The roofs within `reach` of a point (by cell). */
  private near(x: number, z: number, reach: number): Roof[] {
    const out: Roof[] = [];
    const c = Math.ceil(reach / 60);
    const cx = Math.floor(x / 60), cz = Math.floor(z / 60);
    for (let i = -c; i <= c; i++) for (let j = -c; j <= c; j++) { const l = this.cells.get(`${cx + i}:${cz + j}`); if (l) out.push(...l); }
    return out;
  }
  /** A spot on a roof clear of its kit (a tank, an annex): six tries, else the centre. */
  private spotOn(roof: Roof): [number, number] {
    for (let k = 0; k < 6; k++) {
      const x = roof.x + (this.rand() - 0.5) * (roof.w - 1.6), z = roof.z + (this.rand() - 0.5) * (roof.d - 1.6);
      if (!this.solids.hit(x, roof.top + 0.9, z, 0.5)) return [x, z];
    }
    return [roof.x, roof.z];
  }
  /** Where a roof's edge lies toward a point, a step inside it. */
  private edgeToward(roof: Roof, px: number, pz: number, inset: number): [number, number] {
    const dx = px - roof.x, dz = pz - roof.z;
    const hw = roof.w / 2 - inset, hd = roof.d / 2 - inset;
    const k = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : 1e9, Math.abs(dz) > 1e-6 ? hd / Math.abs(dz) : 1e9);
    if (k >= 1) return [roof.x + dx, roof.z + dz]; // the point is inside the roof
    return [roof.x + dx * k, roof.z + dz * k];
  }
  /** The arc's height at u: the ends' line lifted by a parabola. */
  private arcY(from: [number, number, number], dest: [number, number, number], lift: number, u: number): number {
    return from[1] + (dest[1] - from[1]) * u + lift * 4 * u * (1 - u);
  }
  /** The arc clears the city: a sample every 1.2 units of its length at a radius of 1, so that nothing a body's
   *  width (0.3) from a wall slips between two samples — not even an arc cutting a corner. */
  private arcClear(from: [number, number, number], dest: [number, number, number], lift: number): boolean {
    const dist = Math.hypot(dest[0] - from[0], dest[2] - from[2]);
    const len = dist + Math.abs(dest[1] - from[1]) + 2 * lift; // the arc's length, at most
    const n = Math.min(600, Math.max(8, Math.ceil(len / 1.2)));
    for (let k = 1; k < n; k++) { // the ends stand on their roofs (checked apart, tighter)
      const u = k / n;
      const x = from[0] + (dest[0] - from[0]) * u, z = from[2] + (dest[2] - from[2]) * u, y = this.arcY(from, dest, lift, u);
      if (this.solids.hit(x, y + 0.8, z, 1.0)) return false;
    }
    return true;
  }
  /** A flight from the runner's roof: the target roof, the take-off and landing points and the lift, or null. */
  private plan(r: Runner, kind: 'leap' | 'thrust' | 'rocket'): { to: Roof; from: [number, number, number]; dest: [number, number, number]; lift: number } | null {
    const roof = r.roof;
    const cands = kind === 'rocket'
      ? this.roofs.filter((q) => q !== roof && (() => { const d = Math.hypot(q.x - roof.x, q.z - roof.z); return d >= ROCKET_MIN && d <= ROCKET_MAX; })())
      : this.near(roof.x, roof.z, (kind === 'leap' ? LEAP : THRUST) + Math.max(roof.w, roof.d)).filter((q) => {
        if (q === roof) return false;
        const gap = roofGap(roof, q);
        if (kind === 'leap') return gap <= LEAP && gap > -1 && q.top - roof.top <= 3 && roof.top - q.top <= 7;
        return gap <= THRUST && gap > -1 && Math.abs(q.top - roof.top) <= 40;
      });
    if (!cands.length) return null;
    for (let tries = 0; tries < 4; tries++) {
      const to = kind === 'rocket' ? this.draw(cands) : cands[Math.floor(this.rand() * cands.length)]; // a rocket heads for the heart more often than not
      const take = kind === 'rocket' ? this.spotOn(roof) : this.edgeToward(roof, to.x, to.z, 0.7);
      const landAt = kind === 'rocket' ? this.spotOn(to) : this.edgeToward(to, roof.x, roof.z, 1.6);
      const from: [number, number, number] = [take[0], roof.top, take[1]], dest: [number, number, number] = [landAt[0], to.top, landAt[1]];
      if (this.solids.hit(from[0], from[1] + 0.9, from[2], 0.8) || this.solids.hit(dest[0], dest[1] + 0.9, dest[2], 0.8)) continue; // the take-off or the landing stands in kit
      const dist = Math.hypot(dest[0] - from[0], dest[2] - from[2]);
      const base = Math.max(from[1], dest[1]);
      let lift = kind === 'leap' ? base - from[1] + 2.4 : kind === 'thrust' ? base - from[1] + 8 + dist * 0.12 : base - from[1] + 30 + dist * 0.07; // a rocket arcs over the skyline, not out of the tour's sight
      for (let raise = 0; raise < 3; raise++) {
        if (this.arcClear(from, dest, lift)) return { to, from, dest, lift };
        lift *= 1.5;
      }
    }
    return null;
  }
  private spark(x: number, y: number, z: number, big: boolean): void {
    const t = this.trail, i = t.head; t.head = (t.head + 1) % t.n;
    t.pos[i * 3] = x; t.pos[i * 3 + 1] = y; t.pos[i * 3 + 2] = z;
    t.vel[i * 3] = (this.rand() - 0.5) * 0.08; t.vel[i * 3 + 1] = -(0.06 + this.rand() * 0.1) * (big ? 1.6 : 1); t.vel[i * 3 + 2] = (this.rand() - 0.5) * 0.08;
    t.col[i * 3] = 0.85; t.col[i * 3 + 1] = 0.4 + this.rand() * 0.25; t.col[i * 3 + 2] = 0.08; // an ember
    t.life[i] = big ? 44 : 28;
  }

  step(): void {
    this.tick += 1;
    const r0 = this.rand;
    const t = this.trail; // the sparks fall and fade
    for (let i = 0; i < t.n; i++) {
      if (t.life[i] <= 0) continue;
      t.life[i] -= 1;
      t.pos[i * 3] += t.vel[i * 3]; t.pos[i * 3 + 1] += t.vel[i * 3 + 1]; t.pos[i * 3 + 2] += t.vel[i * 3 + 2];
      t.col[i * 3] *= 0.97; t.col[i * 3 + 1] *= 0.94; t.col[i * 3 + 2] *= 0.9;
      if (t.life[i] === 0) { t.col[i * 3] = 0; t.col[i * 3 + 1] = 0; t.col[i * 3 + 2] = 0; }
    }
    for (const r of this.runners) {
      switch (r.act) {
        case 'dance': { // on the beat: a hand up, a step, a turn
          const beat = ((this.tick + r.phase) >> 3) & 3;
          r.frame = beat === 0 ? RUN_FRAME.talk : beat === 1 ? RUN_FRAME.walkA : beat === 2 ? RUN_FRAME.stand : RUN_FRAME.walkB;
          r.y = r.roof.top + (((this.tick + r.phase) & 7) < 2 ? 0.18 : 0);
          r.yaw += 0.01;
          if (--r.timer <= 0) this.choose(r);
          break;
        }
        case 'run': { // toward the spot, a stride every four frames
          const dx = r.tx - r.x, dz = r.tz - r.z, d = Math.hypot(dx, dz);
          if (d <= RUN_V) { r.x = r.tx; r.z = r.tz; this.arrive(r); break; }
          r.x += dx / d * RUN_V; r.z += dz / d * RUN_V; r.y = r.roof.top;
          r.yaw = Math.atan2(dx, dz);
          r.frame = ((this.tick + r.phase) >> 2) & 1 ? RUN_FRAME.run : RUN_FRAME.walkB;
          break;
        }
        case 'leap': case 'thrust': case 'rocket': { // along the arc
          r.t += 1;
          const u = Math.min(1, r.t / r.T);
          r.x = r.from[0] + (r.dest[0] - r.from[0]) * u; r.z = r.from[2] + (r.dest[2] - r.from[2]) * u;
          r.y = this.arcY(r.from, r.dest, r.lift, u);
          r.yaw = Math.atan2(r.dest[0] - r.from[0], r.dest[2] - r.from[2]);
          r.frame = r.act === 'leap' ? RUN_FRAME.leap : RUN_FRAME.thrust;
          if (r.act !== 'leap') for (let k = 0; k < (r.act === 'rocket' ? 4 : 2); k++) this.spark(r.x + (r0() - 0.5) * 0.3, r.y + 0.1, r.z + (r0() - 0.5) * 0.3, r.act === 'rocket');
          if (u >= 1) { r.roof = r.to!; r.to = null; r.x = r.dest[0]; r.y = r.roof.top; r.z = r.dest[2]; r.act = 'land'; r.timer = r.act === 'land' ? 14 : 0; r.frame = RUN_FRAME.walkA; }
          break;
        }
        case 'land': { // a roll, then on
          r.frame = ((this.tick + r.phase) >> 2) & 1 ? RUN_FRAME.walkA : RUN_FRAME.stand;
          r.y = r.roof.top;
          if (--r.timer <= 0) { if (r0() < 0.8) this.choose(r); else { r.act = 'dance'; r.timer = 40 + r0() * 160; } } // (owner: no idle crowds on the roofs — mostly on, a short dance now and then)
          break;
        }
      }
    }
  }
  /** What next from a roof: a leap where one is possible (most often), a thruster hop, a rocket across the city now and
   *  then, a run to another spot on this roof, or a dance. The flight is planned now; the runner first runs to its
   *  take-off point. */
  private choose(r: Runner): void {
    const a = this.rand();
    // the kinds in the order they are tried: a leap first, most often; a hop; now and then a rocket; the next kind when
    // one cannot be planned from this roof (a runner used to dance whenever its first choice found no roof)
    const order: ('leap' | 'thrust' | 'rocket')[] = a < 0.5 ? ['leap', 'thrust'] : a < 0.8 ? ['thrust', 'leap'] : a < 0.9 ? ['rocket', 'thrust', 'leap'] : [];
    for (const kind of order) {
      const flight = this.plan(r, kind);
      if (!flight) continue;
      r.to = flight.to; r.from = flight.from; r.dest = flight.dest; r.lift = flight.lift;
      const dist = Math.hypot(flight.dest[0] - flight.from[0], flight.dest[2] - flight.from[2]);
      r.T = Math.max(kind === 'leap' ? 26 : kind === 'thrust' ? 60 : 200, Math.round(dist / (kind === 'leap' ? 0.17 : kind === 'thrust' ? 0.3 : 0.75)));
      r.t = 0;
      r.tx = flight.from[0]; r.tz = flight.from[2];
      r.act = 'run';
      (r as Runner & { next?: 'leap' | 'thrust' | 'rocket' }).next = kind;
      return;
    }
    if (this.rand() < 0.75) { const spot = this.spotOn(r.roof); r.tx = spot[0]; r.tz = spot[1]; r.act = 'run'; (r as Runner & { next?: null }).next = null; }
    else { r.act = 'dance'; r.timer = 40 + this.rand() * 160; }
  }
  /** Arrived at the spot: take off if a flight was planned, else dance. */
  private arrive(r: Runner): void {
    const next = (r as Runner & { next?: 'leap' | 'thrust' | 'rocket' | null }).next;
    if (next && r.to) { r.act = next; r.t = 0; if (next !== 'leap') { r.flights += 1; if (next === 'rocket') this.rockets += 1; } return; }
    r.act = 'dance'; r.timer = 40 + this.rand() * 160;
  }
}
