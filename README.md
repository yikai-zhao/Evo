# Evo — Twilight of the Gods

A multiplayer mythic-evolution battle royale, playable in any browser.
**Hunt → Ascend → Survive the shrinking Veil → Become the True God.**

[![play now](https://img.shields.io/badge/play-now-ff66cc)](https://evo.example) [![version](https://img.shields.io/badge/version-3.7.0-7fd07f)]() [![smoke tests](https://img.shields.io/badge/tests-passing-7fd07f)]()

---

## What it is

Evo is a single-file HTML5 Canvas game — no engine, no framework, no install.
You choose one of **56 creatures across 6 evolutionary paths** (Human / Dragon / Beast / Bird / Fish / Insect), kill, eat, evolve through 9 mortal tiers and 10 mythic Sequences, and try to claim one of the 6 Thrones before the **Veil of Erasure** closes in and erases everyone outside the ring.

### The endgame loop

| Time | What happens |
|---|---|
| 0–5 min | Open world. Hunt, evolve, claim Authorities, fight Outer Gods. |
| 5 min   | **Veil of Erasure** descends — purple ring shrinks over 12 minutes. |
| 5–17 min| Outside the ring → 1.8 %/sec corruption damage. Form a party (press `Y`). |
| 16–17 min | **Final Tribulation** — last 5 entities get +30 % all stats, an extra Outer God spawns. |
| Victory | (a) Slay a True God and claim the throne, **or** (b) be the last party / individual alive. |

---

## Quick start (local dev)

```bash
npm install
npm start          # local server on :8080 + WebSocket on :8081
# open http://localhost:8080
```

## Build for distribution

```bash
npm run build               # builds all 3 platform zips
npm run build:crazygames    # single platform
npm run build:poki
npm run build:itch
# → dist/Evo-<platform>-v<VERSION>.zip
```

Build is gated by `prebuild` which runs `version:sync` (rewrites `?v=` in `index.html` from `package.json`) and `smoke-test.js`. **You cannot ship a build that fails tests.**

## Tests

```bash
npm test                    # parses JS, checks 14 required functions, asserts cache-bust alignment, validates assets
npm run version:check       # CI guard — fails if ?v= drift detected
```

---

## Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move |
| Left-click / Space | Melee (cone attack) |
| Right-click | Defend (80 % reduction + 30 % reflect) |
| `X` | Dash |
| `E` | Eat / pickup |
| `Q` | Refine Qi (humans only — burns lifespan for permanent stats) |
| `R` | Authority ultimate |
| `1` / `2` / `3` | Equipped Authority skills |
| `Y` | **Party panel** (invite nearby players) |
| `A` / `D` | Accept / decline incoming party invite |
| `T` | Chat (multiplayer) |
| `M` | Star map |
| `P` | Ping |
| `Esc` / `Shift+P` | Pause |

Touch devices: virtual stick + 3 action buttons.

---

## Architecture

```
game.js     ~7400 lines · ~235 functions · vanilla JS, no framework
net.js      WebSocket client (peer position / damage / chat / party sync)
sdk.js      Platform SDK adapter (CrazyGames / Poki / standalone)
server.js   Authoritative-lite Node WS relay (rooms, anti-cheat throttling)
scripts/
  build-platform.js   Per-platform zip builder (minify + cache-bust)
  sync-version.js     Keeps ?v= aligned to package.json
  smoke-test.js       Pre-build CI gate (parse, symbols, assets)
  gen-portraits.mjs   AI portrait pipeline (114 species artworks)
```

### Known limitations

- World state lives on a global `G` object — fine for the current single-room model, but a server-authoritative rewrite would mean unwinding it into reducer-style modules. Not blocking for ad-driven monetisation.
- `try/catch` is used defensively around every render/update stage to keep one bad frame from killing the game; a future pass should distinguish recoverable from fatal errors.
- Multiplayer is best-effort peer-sync, not lock-step deterministic. Damage is client-authoritative with server-side rate limits — fine for casual PvP, not for ranked.

---

## Distribution targets

The same codebase ships to all of these in parallel (only Poki may require exclusivity):

| Platform | Conflict? | eCPM range |
|---|---|---|
| CrazyGames | No (unless you sign Originals) | $3–$8 |
| Poki | Yes (high-eCPM contract often exclusive) | $4–$10 |
| GameMonetize / GameDistribution | No — rebroadcasts to 1000s of sites | $0.5–$2 |
| itch.io (free or paid) | No | one-time $3–$5 |
| Self-hosted + AdSense | No | $1–$3 |
| Steam (web → Electron wrap) | Needs offline mode + extra content to justify | one-time $5–$10 |

See `SUBMISSION.md` for portal-specific submission checklists.

---

## Versioning & releases

All assets, scripts, and styles are cache-busted via `?v=` matching `package.json`.
**To ship a new version:**

```bash
# 1. bump package.json version
npm version patch        # or minor/major
# 2. sync cache-bust + run smoke test + build
npm run build
# 3. upload dist/Evo-<platform>-v<VERSION>.zip
```

The build will refuse to start if smoke tests fail.

## License

ISC — see `LICENSE`.
