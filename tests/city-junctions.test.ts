import { describe, expect, it } from 'vitest';
import { planCity, ROAD, STREET } from '../src/about/city-plan';
import { armReach, carHalf, convexHull, throughReach, Traffic } from '../src/about/city-traffic';
import { mulberry32 } from '../src/lib/rng';
import { hashSlug } from '../src/project/dossier';

const plan = planCity(hashSlug('revachol-night-city'));
const traffic = new Traffic(plan.streets, mulberry32(11));

describe("the junctions' paint (owner: zebras painted over each other at the six-ways)", () => {
  it("reaches the other street's pavement and a step at a right angle, as before; its carriageway where a street runs through", () => {
    const roads = plan.streets.filter((s) => s.kind === 'road');
    const ew = roads.find((s) => s.dz === 0)!, ns = roads.find((s) => s.dx === 0)!;
    expect(armReach(ew, [ns])).toBeCloseTo(STREET / 2 + 1.5, 5);
    expect(throughReach(ew, [ns])).toBeCloseTo(ROAD / 2, 5);
    const diag = plan.streets.find((s) => s.kind === 'diagonal')!;
    expect(armReach(ew, [ns, diag])).toBeGreaterThan(14); // the boulevard's right of way runs far along a road it crosses at 45°
  });

  it("keeps every zebra clear of every other street's carriageway at every junction of the plan", () => {
    const junctions = traffic.nodes.filter((n) => n.streets.length >= 2 && Math.abs(n.y) < 1 && !n.streets.some((q) => q.kind === 'highway' || q.kind === 'ramp'));
    let zebras = 0, oblique = 0;
    for (const n of junctions) {
      if (n.streets.some((a, ia) => n.streets.some((b, ib) => { const s = Math.abs(a.dx * b.dz - a.dz * b.dx); return ib > ia && s < 0.9 && s > 0.35; }))) oblique += 1;
      if (!n.streets.every((q) => q.kind !== 'lane')) continue;
      for (const st of n.streets) {
        const others = n.streets.filter((o) => o !== st);
        const reach = armReach(st, others), half = carHalf(st);
        const arms = new Set<number>();
        for (const p of n.ports) if (p.link.street === st) arms.add(p.end === 0 ? 1 : -1);
        for (const d of arms) {
          zebras += 1;
          for (const along of [reach + 0.2 - 1.1, reach + 0.2 + 1.1]) for (const s of [-1, 1]) { // the zebra's four corners
            const x = n.x + st.dx * d * along - st.dz * s * (half + 0.2), z = n.z + st.dz * d * along + st.dx * s * (half + 0.2);
            for (const o of others) {
              const t = (x - o.x0) * o.dx + (z - o.z0) * o.dz, lat = Math.abs((x - o.x0) * -o.dz + (z - o.z0) * o.dx);
              const inside = t > 0 && t < o.len && lat < carHalf(o) - 0.01;
              expect(inside, `a zebra corner of a ${st.kind} arm at ${x.toFixed(1)},${z.toFixed(1)} inside the ${o.kind}'s carriageway at the node ${n.x.toFixed(0)},${n.z.toFixed(0)}`).toBe(false);
            }
          }
        }
      }
    }
    expect(zebras).toBeGreaterThan(400);
    expect(oblique).toBeGreaterThanOrEqual(5); // the boulevard's crossings
  });

  it('ends each half of the boulevard at the crossing beside the citadel (owner: the boulevard cut)', () => {
    for (const [x, z] of [[-171, -95], [-95, -171]]) {
      const n = traffic.nodes.find((q) => Math.abs(q.x - x) < 0.6 && Math.abs(q.z - z) < 0.6)!;
      expect(n, `a node at ${x},${z}`).toBeTruthy();
      expect(n.streets.length).toBe(3); // the two grid roads (one a T there) and the boulevard's half
      expect(n.streets.filter((s) => s.kind === 'diagonal').length).toBe(1);
      expect(n.ports.filter((p) => p.link.street.kind === 'diagonal').length).toBe(1); // one arm: it ends here
    }
  });

  it("hulls a junction's mouths", () => {
    const h = convexHull([[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [1, 3]]);
    expect(h.length).toBe(4);
    expect(h).toContainEqual([0, 0]);
    expect(h).not.toContainEqual([2, 2]);
  });
});
