# Lands End — AI Art Prompt Pack v1.0

> Hand this whole folder to Midjourney v6 / DALL-E 3 / SDXL / Flux Pro to generate
> production-grade art that matches the in-game aesthetic. Every prompt anchors to
> the same **Style Bible** (below) so all outputs feel like one cohesive game.

---

## STYLE BIBLE (paste at end of every prompt)

```
art style: dark cosmic cultivation, eldritch xianxia, painterly digital art,
hand-painted brushstrokes, dramatic rim-lighting, gold trim on deep void purple,
high contrast between black silhouettes and saturated neon accents,
particles of golden stardust drifting, sacred geometric runes glowing softly,
oriental mystical, Hayao-Miyazaki-meets-Lovecraft, no text, no watermarks,
clean negative space, suitable for HTML5 game asset, --ar 16:9 --v 6 --style raw
```

For square assets (icon/avatar), swap `--ar 16:9` → `--ar 1:1`.
For portrait (mobile splash), swap → `--ar 9:16`.

**Color Palette** (force this in every prompt):
- Primary: deep void purple `#3a1f5a`, jet black `#08040f`
- Accent gold: `#ffd66b`, `#ffaa30`
- Boss colors (rotate by character): magenta-purple `#aa44ff`, blood red `#ff4444`,
  ice cyan `#66ccff`, phoenix orange `#ffaa30`, serpent green `#44dd66`
- Highlight white-gold: `#ffe9b8`

**Forbidden** (always include in negative prompt):
`anime moe, chibi, low quality, jpeg artifacts, 3d render, blurry, text,
logo, watermark, signature, oversaturated cartoon, kid-friendly pastel`

---

## 1. COVER ART — Poki / CrazyGames thumbnail (1024×512, 16:9)

```
A massive golden dragon spirit rises from a sea of stars, eyes blazing crimson,
six tentacled arms unfurling, surrounded by smaller awe-struck creatures
(a purple wraith on the right, a cyan koi on the left), all in painterly
silhouette. Background: cosmic horror starscape with distant violet nebula,
ancient mountain ruins on the horizon. Foreground glowing golden runes orbit
the dragon. Center-bottom shows the words "LANDS END" in cracked golden
oriental brush calligraphy (or leave space for text overlay).
[STYLE BIBLE]
```

**Variants to generate (pick the best):**
- v1: Replace dragon with eldritch eye (Star-Touching Eye boss style)
- v2: Replace dragon with phoenix mid-flight, flames trailing
- v3: Wide ensemble shot — 5 creatures evolving from small to godlike along a path

---

## 2. ICON / FAVICON — App tile (512×512, 1:1)

```
Heroic golden Eastern dragon head emblem, front-facing, crimson glowing eyes,
horns curved upward, surrounded by a circular halo of golden runes, deep void
purple background, painterly digital art, app icon composition, vignette
darkness in corners, centered subject, rounded square framing.
[STYLE BIBLE — square]
```

---

## 3. THE FIVE 古神 (OUTER GODS) — Boss portraits (1024×1024, 1:1)

> Generate one per boss. Use these as **in-game boss intro splash images**
> (show for 2s when boss spawns) or **death-card hero shots**.

### 3a — Star-Touching Eye (purple, default)
```
A colossal floating eyeball god, iris glowing magenta-pink, surrounded by
six writhing black tentacles tipped with golden mystic runes, set against a
deep violet cosmic void with distant stars. Painterly, eldritch, oriental
mystic style. Centered composition, dramatic rim-light.
[STYLE BIBLE]
```

### 3b — Thousand-Mouth Devourer (red)
```
A monstrous spherical god covered in dozens of fanged mouths, central giant
maw opening wide, blood-red flesh with white teeth, four lashing tongues of
flame, set in a dark void with red embers floating. Painterly cosmic horror.
[STYLE BIBLE]
```

### 3c — Frozen-Abyss Crown (cyan)
```
A hexagonal ice god wearing a jagged crown of eight ice shards, central
glowing cyan eye, scattered snowflake particles orbiting, set against a
deep midnight-blue starfield. Painterly, regal, frozen majesty.
[STYLE BIBLE]
```

### 3d — Ashen Phoenix (orange-gold)
```
A massive golden phoenix mid-flight, wings spread wide trailing fire,
red rim-lit feathers, golden beak, crimson eyes, three flame streamers
behind it, against a black cosmic void with orange embers. Painterly,
mythic, oriental phoenix style.
[STYLE BIBLE]
```

### 3e — Nine-Headed Verdant Serpent (green)
```
A nine-headed serpent god coiled around a central glowing core,
nine snake heads on long sinuous necks fanning outward, deep emerald
scales with purple highlights, golden runes on the core, set against
a misty dark forest void. Painterly hydra in eldritch oriental style.
[STYLE BIBLE]
```

---

## 4. THE 13 SPECIES PORTRAITS — Character select screen (512×512 each)

> Use these to replace the geometric creature shapes on the species-select
> menu. Each species should feel "playable hero" — heroic 3/4-view.

For each species, use this template:
```
A heroic [SPECIES NAME] cultivator, painterly portrait, glowing aura of
[COLOR] energy, golden runes orbiting, dark void background, dramatic
side-lit, oriental fantasy style, suitable for game character select screen.
[STYLE BIBLE]
```

Replace `[SPECIES NAME]` / `[COLOR]` with:
1. Spirit Carp (青鯉) — cyan, "transforming into dragon mid-leap"
2. Stone Tortoise (石龜) — earth-brown, "ancient sage, mossy shell"
3. Cloud Crane (雲鶴) — silver-white, "elegant feathered immortal"
4. Flame Fox (火狐) — orange-red, "nine-tailed kitsune in flames"
5. Shadow Wolf (影狼) — black-purple, "wreathed in dark mist"
6. Wraith (幽魂) — pale violet, "translucent ghost spirit"
7. Thunder Eagle (雷鷹) — yellow-gold, "lightning arcing from wings"
8. Frost Serpent (霜蛇) — ice-blue, "ice crystals along scales"
9. Demon Ox (魔牛) — crimson, "armored bull with horns blazing"
10. Sky Monkey (天猴) — orange-yellow, "staff-wielding warrior monkey"
11. Spider Empress (蛛后) — dark green, "eight-legged regal arachnid"
12. Lotus Spirit (蓮神) — pink-gold, "blooming lotus deity"
13. Void Cat (虛貓) — black-cosmic, "feline with starry void fur"

---

## 5. BIOME BACKGROUNDS — Tileable terrain hints (1024×1024, 1:1 seamless)

Generate 8 of these — use as **decorative tile underlays** (not the main tile,
just to give bigger biomes more painterly feel; can be blended at 20% opacity
under the existing procedural tiles).

```
Seamless tileable [BIOME] texture, painterly hand-painted, top-down view,
muted colors with hints of [ACCENT], subtle golden particles scattered,
no characters, no obvious tiling seam, eldritch oriental atmosphere.
[STYLE BIBLE — square — emphasize: tileable, seamless, top-down]
```

Replace `[BIOME]` / `[ACCENT]`:
- plain — gentle hills, "wildflower yellow"
- forest — bamboo grove, "moss green"
- desert — golden dunes, "amber dust"
- swamp — murky waters, "phosphor green"
- water — deep ocean waves, "moonlit cyan"
- mountain — jagged stone, "slate gray"
- snow — powder drifts, "ice blue"
- starsea — cosmic nebula, "violet stardust"

---

## 6. SHORT-VIDEO MARKETING ASSETS — TikTok/Reels still frames (1080×1920, 9:16)

> Generate these for posting on TikTok with overlay text. Each is the
> visual hook frame for a 15-30s video clip.

### 6a — "BONK moment" hook
```
Comic-book POW! BONK! explosion effect, two cartoonish cosmic creatures
mid-collision, confetti and gold stars flying, dynamic motion lines,
painterly + cartoon hybrid, vertical composition for mobile screen.
[STYLE BIBLE — portrait]
```

### 6b — "Evolution reveal" hook
```
A small humble creature transforming into a magnificent dragon god in a
beam of golden light, before-after split composition, painterly, dramatic
"glow up" moment, vertical mobile composition.
[STYLE BIBLE — portrait]
```

### 6c — "Boss arrival" hook
```
A tiny silhouette character looks up in awe at a massive eldritch god
descending from a swirling purple sky, scale contrast extreme, golden
runes raining down, painterly cinematic, vertical composition.
[STYLE BIBLE — portrait]
```

---

## 7. WORKFLOW (recommended)

1. **Cover first** — generate Section 1, pick best, drop into `assets/cover.png`
   (1024×512, replace existing). This is what platforms see first.
2. **Icon second** — generate Section 2, drop into `assets/icon.png` (512×512).
3. **5 Boss splash** — Section 3, drop into `assets/bosses/[type].png`.
   We can wire in-game splash next iteration (2s intro screen on boss spawn).
4. **Species portraits** — Section 4, drop into `assets/species/[name].png`.
   We can swap the menu render to use these (next iteration).
5. **TikTok stills** — Section 6, post 3-5 of these as static images first
   to test which hook performs best, THEN record actual gameplay clips.

---

## 8. BUDGET / TIME ESTIMATE

| Asset Pack | Tool | Cost | Time |
|---|---|---|---|
| Section 1 (cover, 3 variants) | Midjourney v6 | $10/mo + 3 prompts | 30 min |
| Section 2 (icon) | Midjourney / DALL-E 3 | included | 15 min |
| Section 3 (5 boss splashes) | Midjourney | included | 60 min |
| Section 4 (13 species) | Midjourney | included | 90 min |
| Section 5 (8 biomes, optional) | SDXL local | free | 60 min |
| Section 6 (TikTok stills) | Midjourney | included | 30 min |
| **Total** | — | **$10** | **~5 hours** |

vs. hiring a Fiverr illustrator: $200–$500 + 1 week wait.

---

## 9. WIRING NEW ART INTO THE GAME

After you have the PNGs, ping the agent with:
> "I've added new art to assets/bosses/eye.png, maw.png, crown.png, phoenix.png,
> serpent.png. Wire them as 2-second splash screens when each boss spawns."

The agent will load them as Image objects and overlay them in `spawnBoss()`.
