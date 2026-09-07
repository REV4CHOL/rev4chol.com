# Site music: one track, every page, continuous

**Date:** 2026-09-08 · **Status:** as built · **Owner's words:** "Music on all pages and sections, with a dedicated music
button between SND and MTN, except when clicking on the WATCH button in Work pages, then it will stop indefinitely,
before moving to another section or pages. Also the music must never restart when changing sections and other pages.
It's continuous and cannot be interrupted. In the event of a loading screen, the music will continue where it left off
before the loading screen happens. For the SND: remove the ambient background sound."

## The track

Chihei Hatakeyama, *Lost on the Night Road*, the owner's file, copied to `public/content/music/night-road.mp3` (3.9 MB),
looped. Volume 0.55 under the SND clicks. (Publishing a commercial recording on a public site is the owner's call: it
needs a licence the site does not carry.)

## Continuity across pages (`src/lib/music.ts`)

The site's pages are separate documents (the wipe in transitions.ts and the swipe in swipe-nav.ts end in a full
navigation), so a track cannot literally play across them. The next best thing, and the owner's "continue where it
left off": the track's place is carried in `sessionStorage` — the time it was at and the clock then, written on every
`timeupdate`, on `pause`, on `pagehide` and as the wipe starts — and the next page seeks to *where the track would be
now* (`resumeAt`: the saved time plus the seconds since, wrapped by the track's length) and plays on. A page reached
by a click may play at once (Chrome carries the user activation across same-origin navigations, as the sound engine
already relies on); a cold load (a typed address, a reload) waits for the page's first pointer, key or touch. The
wipe fades the music over its first 220 ms and the next page fades it in over 500 ms: a short dip, never a restart.
Safari on a phone requires a gesture on every new document: there the music resumes at the first tap of each page.

## Before the loading screen

`startPage` (page.ts) starts the music *before* `runBoot`'s loading screen, so the boot tasks run under it; the About
page's city build, which holds the main thread for seconds, awaits `music.ready()` (audibly playing, or 600 ms; at
once when the music is waiting for a gesture) before it begins, so the build never cuts the track's start.

## The MUS button

`MUS ● / ○` in the HUD between SND and MTN (hud.ts). Off pauses and remembers (`localStorage` `rvl-music-v1`; on by
default); on plays, and lifts a WATCH hold.

## WATCH

On a film page, WATCH (`project.ts`) calls `music.hold()`: a 400 ms fade to a stop, the place saved as *held* — the
next page resumes at exactly that time, not the clock's — and the hold ends there ("until moving to another section
or page"). Nothing on the film page lifts it but MUS.

## The ambient sound

The SND engine's room tone (a filtered noise hum started at the first gesture on every page and by the works page)
is removed: `startHum` / `stopHum` / `humOn` and their call sites in shell.ts, works.ts and hud.ts are gone. SND keeps
its clicks, hovers, whooshes and zaps.

## Tests

`tests/music.test.ts`: `resumeAt` (the clock runs on, wraps, a held place holds, nothing saved starts at 0, no length
yet starts at 0), a page that may play (seek to the saved time plus the clock, fade to the volume, the place saved on
`timeupdate`), a cold load that waits for a gesture, WATCH's hold and the next page's exact resume, the MUS button's
off / on and a hold lifted, leaving (saved, faded). A stand-in deck and stores; fake timers.
