# C25K — Couch to 5K PWA

A minimal progressive web app for the Couch to 5K running program with audio cues that work when the screen is locked.

## Architecture

This is a **static PWA** — no framework, no build step. Just HTML/CSS/JS served from the `public/` directory.

### Key Files
- `public/index.html` — The entire app (single file: HTML + CSS + JS)
- `public/sw.js` — Service worker for offline caching
- `public/manifest.json` — PWA manifest for "Add to Home Screen"
- `public/silence.mp3` — Silent audio loop that keeps the browser alive when screen is locked
- `public/icon-192.png` / `public/icon-512.png` — PWA icons

### How Background Audio Works
iOS Safari suspends JavaScript when the screen locks. The workaround:
1. When a workout starts, we play `silence.mp3` on loop via an `<audio>` element
2. This tricks Safari into treating the page as "playing media" and keeping JS alive
3. Our `setInterval` continues firing, so beeps and speech announcements work
4. The silent audio volume is set to 0.01 (not 0, which gets optimized away)
5. When the workout ends, we stop the silent audio to save battery

### Timer System
- Uses wall-clock time (`Date.now()`) not interval counting
- `backgroundAwareTick()` checks elapsed real time every 250ms
- If the browser was suspended briefly, it catches up by processing multiple seconds
- Phase transitions (run/walk) trigger beeps and speech even after catch-up

### Data Storage
All data is in `localStorage`:
- `c25k_progress` — Which weeks/days are completed (for checkmarks)
- `c25k_history` — Array of completed workouts with timestamps and durations

## Deployment

Deploy to Vercel as a static site:

```bash
npm i -g vercel
cd c25k-app
vercel --prod
```

Vercel will serve everything from `public/` automatically.

## Future Ideas
- Cloud sync for workout history (currently localStorage only)
- Custom workout builder
- GPS tracking / route mapping
- Integration with Apple Health
- Social features (share runs)

## Program Structure

The 8-week program is defined in the `program` array in index.html. Each week has:
- `intervals` — Array of `{ type: 'run'|'walk'|'warmup'|'cooldown', duration: seconds }`
- Optional `days` array for weeks where Day 2 and Day 3 differ from Day 1 (weeks 5, 6, 8)

All sessions include a 5-min warmup walk and 5-min cooldown walk.
