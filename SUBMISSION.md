# Lands End — Portal Submission Guide

This file collects every field, asset, and link you'll need to publish **Lands End** on **CrazyGames**, **Poki**, and **itch.io**. Copy/paste the blocks straight into the developer dashboard.

> Build artifact: run `npm run build` → produces `dist/Evo-platform.zip` (≤ ~30 MB after the v3.6.0 WebP compression pass). Upload that ZIP to each portal.

---

## 1. Game metadata (shared)

| Field | Value |
|---|---|
| **Title** | Lands End |
| **Sub-title / tagline** | Evolve. Devour. Ascend. A 9-rank survival-evolution .io game. |
| **Genre / tags** | io, multiplayer, survival, evolution, action, pvp, single-player, casual |
| **Controls** | WASD / Arrows = move · Mouse = aim · LMB / Space = attack · 1-4 = abilities · E = use rift · Esc = menu |
| **Orientation** | Landscape only |
| **Player count** | 1–24 per server (peer-to-peer mesh) |
| **Languages** | English |
| **Engine** | Vanilla JS / HTML5 Canvas (no framework, instant load) |

### Short description (120 chars)

> Hunt, evolve, and become a god in this 9-rank survival arena. Compete with other players or play solo.

### Long description (use on all portals)

> **Lands End** is a fast-paced survival-evolution .io game where every kill brings you closer to godhood.
>
> - **9 evolution ranks** — start as a humble cultivator or beast, end as a true god with map-shattering ultimates.
> - **13 playable species** — humans, dinosaurs, sea creatures, sky predators, and more, each with their own evolution chain.
> - **Outer Gods** — colossal bosses spawn periodically. Defeat them solo or team up to claim their power.
> - **Sanctums & Authorities** — capture rift zones, hold elemental authorities, and rewrite the laws of the realm.
> - **Daily quests, weekly challenges, login streaks, lucky spin** — meta-progression that rewards every session.
> - **Cross-platform multiplayer** — peer-to-peer matchmaking, no account, no install, instant play.
>
> Built mobile-friendly with touch controls, AdSense/SDK-ready, and zero third-party trackers.

---

## 2. CrazyGames developer dashboard

Dashboard → **Games → New game → HTML5 upload**.

| Field | Value |
|---|---|
| Game name | Lands End |
| Genre | IO / Survival |
| Tags | io, survival, evolution, multiplayer, action |
| Thumbnail (512×384) | `assets/cover.png` (resize) |
| Cover image (1280×720) | `assets/cover.png` |
| Logo (256×256 transparent PNG) | `assets/icon.png` |
| ZIP upload | `dist/Evo-platform.zip` |
| Entry point | `index.html` |
| SDK integration | ✅ already integrated — see `loader.js` (`window.CrazyGames.SDK.init`, `gameplayStart/Stop`, `requestAd('rewarded' | 'midgame')`) |

CrazyGames checklist (pre-submit):
- [x] Game loads from `index.html` without absolute URLs
- [x] No external XHR to non-https origins
- [x] `CrazyGames.SDK.game.gameplayStart()` called on run start
- [x] `CrazyGames.SDK.game.gameplayStop()` called on game-over screen
- [x] Rewarded ad button on death screen → grants revive
- [x] Mid-game ad called at most once per 60s
- [x] Mute button respects `CrazyGames.SDK.user.preferences`

---

## 3. Poki developer dashboard

Dashboard → **Games → New build**.

| Field | Value |
|---|---|
| Title | Lands End |
| Category | IO / Action / Adventure |
| Tags | io, evolution, survival, multiplayer, pvp |
| Min age | 7+ (mild fantasy combat, no blood) |
| ZIP upload | `dist/Evo-platform.zip` (must be < 50 MB) |
| SDK version | Poki SDK v4 (in `loader.js`) |

**Poki SDK checklist** (all already wired in code):
- [x] `PokiSDK.init()` called before assets load
- [x] `PokiSDK.gameLoadingStart()` / `gameLoadingFinished()` around asset preload
- [x] `PokiSDK.gameplayStart()` on first input after menu
- [x] `PokiSDK.gameplayStop()` on death / menu return
- [x] `PokiSDK.commercialBreak()` between runs (cooldown 60s)
- [x] `PokiSDK.rewardedBreak()` on the "Revive" button — re-spawn with full HP on success
- [x] `PokiSDK.happyTime(intensity)` on boss kill / daily-challenge completion / evolution
- [x] No game-pausing audio outside `gameplayStart/Stop`

Performance (Poki min spec, low-tier Chromebook):
- Idle FPS ≥ 55 with default settings
- First-input latency < 2 s after `gameLoadingFinished`
- Memory at 10 min mark < 350 MB (v3.6.0 WebP compression keeps texture pool to ~25 MB)

---

## 4. itch.io page

Upload type: **HTML game**, embed in page.

```markdown
# Lands End — Evolve, Devour, Ascend

A 9-rank survival-evolution .io game. Hunt creatures, slay Outer Gods, evolve from beast to deity. Play solo or with 24 players.

**Play in browser** — no install, no account.

[🎮 Click to start →](#play)

## Features
- 13 species × 9 evolution ranks = 117 unique forms
- Cosmic-tier Outer God bosses with cinematic intros
- Capture sanctums, claim elemental authorities, rewrite reality
- Daily quests, weekly challenges, login streaks, lucky spin
- Peer-to-peer multiplayer — no server needed

## Controls
- WASD / Arrows — move
- Mouse — aim
- LMB / Space — attack
- 1–4 — abilities
- E — enter rift / use sanctum

## Tech
Pure vanilla JS + HTML5 Canvas. ~80 kB game logic, instant load.
```

itch.io fields:
- Embed: 1280×720, full-screen button enabled
- Mobile: Allow (the game has touch controls)
- Pricing: Free / pay-what-you-want
- Visibility: Public after smoke-test pass

---

## 5. Smoke-test checklist before each submission

Run through this in the deployed build:

1. Title screen renders inside 3 s on a cold cache.
2. Click **Play** → tutorial overlay shows for 5 s, then a stationary practice dummy is reachable within 3 s of running.
3. Kill the dummy → first floating "+coins" toast appears.
4. Reach rank 2 → evolution banner + slowmo flash plays.
5. Walk to a Sanctum → press E → capture progresses, "★ Sanctum captured" log line shows.
6. Survive 60 s → Outer God spawn at center, cinematic intro plays with art.
7. Die → death screen → **Revive (Watch ad)** button shows; **Restart** returns to menu.
8. Menu shows coins, daily-quest progress, revenge list (if any).
9. On mobile portrait, rotate prompt shows; in landscape, on-screen joystick + buttons work.
10. Audio mute toggle persists across runs.

---

## 6. Asset bundle for store pages

| Asset | Path | Notes |
|---|---|---|
| 512×512 icon | `assets/icon.png` | Transparent BG |
| 1280×720 cover | `assets/cover.png` | Hero shot |
| In-game screenshots | _capture from dev build_ | Required: 5× 1920×1080 |
| Gameplay trailer (30 s) | _record from dev build_ | Required for Poki feature spot |

---

## 7. Version history (recent)

- **v3.6.0** — Soul Shards meta wire-up, revenge tracking, daily-challenge integration, WebP portrait compression (≈70% smaller bundle).
- **v3.5.2** — Multiplayer kill-feed unification, peer-hit reliability fix, on-death revenge marker save.
- **v3.5.0** — PvP melee balance, Outer-God HP scaling, Rift cooldown cut.
- **v3.4.4** — AI-art portrait pipeline, lazy-load with procedural fallback.
- **v2.x** → see `CHANGELOG.md`.

---

_Last updated: v3.6.0 — generated by build pipeline._
