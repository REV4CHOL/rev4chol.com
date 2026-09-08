import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Deck, Music, readSaved, resumeAt, Store, TRACK, VOLUME } from '../src/lib/music';

const mem = (): Store & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } }; };
/** A stand-in <audio>: records its listeners, plays or refuses on command. */
const deck = (refuse = false) => {
  const ls = new Map<string, (() => void)[]>();
  const d: Deck & { fire(type: string): void; plays: number } = {
    src: '', loop: false, preload: '', volume: 0, currentTime: 0, duration: 300, paused: true, plays: 0,
    play() { this.plays += 1; if (refuse) return Promise.reject(new Error('NotAllowedError')); this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; d.fire('pause'); },
    addEventListener(type, cb) { ls.set(type, [...(ls.get(type) ?? []), cb]); },
    fire(type) { for (const cb of ls.get(type) ?? []) cb(); },
  };
  return d;
};
const flush = async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); }; // (microtasks only: the timers are faked)

describe('resumeAt', () => {
  it('runs the clock on from where the track was, wraps by its length, holds a held place, starts fresh with nothing', () => {
    expect(resumeAt({ t: 100, at: 1000, held: false }, 6000, 300)).toBe(105);
    expect(resumeAt({ t: 290, at: 0, held: false }, 20000, 300)).toBe(10);
    expect(resumeAt({ t: 100, at: 1000, held: true }, 6000, 300)).toBe(100);
    expect(resumeAt(null, 6000, 300)).toBe(0);
    expect(resumeAt({ t: 100, at: 1000, held: false }, 6000, NaN)).toBe(0);
    const s = mem(); s.setItem('rvl-music-pos', '{"t":12,"at":34,"held":true}');
    expect(readSaved(s)).toEqual({ t: 12, at: 34, held: true });
    s.setItem('rvl-music-pos', 'garbage'); expect(readSaved(s)).toBeNull();
  });
});

describe('Music (owner: continuous across pages and sections, a MUS button, WATCH holds it)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  const timers = { set: (fn: () => void, ms: number) => setInterval(fn, ms), clear: (h: ReturnType<typeof setInterval>) => clearInterval(h) };

  it('plays on at once on a page that may, seeks to where the track would be now, fades in, and saves its place', async () => {
    const d = deck(), local = mem(), session = mem();
    session.setItem('rvl-music-pos', JSON.stringify({ t: 100, at: 1000, held: false }));
    const m = new Music(d, local, session, () => 4000, timers);
    m.init();
    expect(d.src).toBe(TRACK); expect(d.loop).toBe(true);
    d.fire('loadedmetadata');
    expect(d.currentTime).toBe(103);
    await flush();
    expect(m.playing()).toBe(true);
    vi.advanceTimersByTime(600);
    expect(d.volume).toBeCloseTo(VOLUME, 5);
    d.currentTime = 110; d.fire('timeupdate');
    expect(readSaved(session)).toEqual({ t: 110, at: 4000, held: false });
  });

  it('waits for a gesture on a cold load, then plays', async () => {
    const d = deck(true), m = new Music(d, mem(), mem(), () => 0, timers);
    m.init(); await flush();
    expect(m.playing()).toBe(false); expect(d.plays).toBe(1);
    m.gesture(); await flush();
    expect(d.plays).toBe(2); // (the stand-in refuses always: the retry was asked for)
  });

  it('WATCH holds it: a fade, a stop, a place saved as held; the next page resumes exactly there and the hold ends', async () => {
    const d = deck(), session = mem(), m = new Music(d, mem(), session, () => 9000, timers);
    m.init(); d.fire('loadedmetadata'); await flush(); vi.advanceTimersByTime(600);
    d.currentTime = 42; m.hold();
    expect(m.held).toBe(true);
    vi.advanceTimersByTime(500);
    expect(d.paused).toBe(true); expect(d.volume).toBe(0);
    expect(readSaved(session)).toEqual({ t: 42, at: 9000, held: true });
    const d2 = deck(), m2 = new Music(d2, mem(), session, () => 99000, timers);
    m2.init(); d2.fire('loadedmetadata'); await flush();
    expect(d2.currentTime).toBe(42); expect(m2.held).toBe(false); expect(m2.playing()).toBe(true);
  });

  it('adopts the head boot’s element: no src reset, no second seek, just the volume', () => {
    const d = deck(); d.src = TRACK; d.paused = false; d.currentTime = 50; d.volume = 0.2;
    const session = mem(); session.setItem('rvl-music-pos', JSON.stringify({ t: 100, at: 0, held: false }));
    const m = new Music(d, mem(), session, () => 99000, timers);
    m.init(); d.fire('loadedmetadata');
    expect(d.currentTime).toBe(50); expect(d.plays).toBe(0);
    vi.advanceTimersByTime(200);
    expect(d.volume).toBeCloseTo(VOLUME, 5); expect(m.time()).toBe(50);
  });

  it("MUS pressed while on but silent (refused, waiting — a phone's cold load) plays instead of turning it off", async () => {
    const d = deck(true), local = mem(), m = new Music(d, local, mem(), () => 0, timers);
    m.init(); await flush();
    expect(m.enabled).toBe(true); expect(m.playing()).toBe(false); expect(d.plays).toBe(1);
    expect(m.toggle()).toBe(true); await flush();
    expect(m.enabled).toBe(true); expect(d.plays).toBe(2); expect(local.getItem('rvl-music-v1')).not.toBe('off');
  });

  it('MUS off stops and remembers; on lifts a hold and plays; leaving saves and fades', async () => {
    const d = deck(), local = mem(), mem2 = mem(), m = new Music(d, local, mem2, () => 0, timers);
    m.init(); d.fire('loadedmetadata'); await flush();
    expect(m.toggle()).toBe(false); vi.advanceTimersByTime(400);
    expect(local.getItem('rvl-music-v1')).toBe('off'); expect(d.paused).toBe(true);
    const m2 = new Music(deck(), local, mem(), () => 0, timers);
    expect(m2.enabled).toBe(false);
    m.hold(); expect(m.toggle()).toBe(true); await flush();
    expect(m.held).toBe(false); expect(m.playing()).toBe(true);
    vi.advanceTimersByTime(600); d.currentTime = 77; m.leave(); vi.advanceTimersByTime(300);
    expect(d.volume).toBeCloseTo(VOLUME, 5); // (no fade: it plays to the page's last moment)
    expect(readSaved(mem2)!.t).toBe(77);
  });
});
