# Species portraits

Drop one PNG per species here. Recommended: 512×512, square, transparent background, centered subject with breathing room.

Filenames (must match exactly):

| File                 | Display name   |
|----------------------|----------------|
| `swordsman.png`      | Swordsman      |
| `cultivator.png`     | Cultivator     |
| `dino.png`           | Dinosaur       |
| `longSnake.png`      | Jiao Serpent   |
| `lizard.png`         | Lizard         |
| `croc.png`           | Crocodile      |
| `wolf.png`           | Wolf           |
| `eagle.png`          | Eagle          |
| `owl.png`            | Night Owl      |
| `bat.png`            | Bat            |
| `shark.png`          | Shark          |
| `electroEel.png`     | Eel            |
| `scorpion.png`       | Scorpion       |

If a file is missing the game falls back to the procedural shape, so you can ship incrementally.

Optional (per-rank portraits — drop these to get rank-evolving art):
`<key>-r3.png`, `<key>-r5.png`, `<key>-r7.png`, `<key>-r9.png`

---

## v3.4.4: auto-generate via OpenAI

Use the batch script to fill all 65 portraits (13 species × 5 ranks) in one command:

```bash
# 1. Get an OpenAI key (with image-gen access): https://platform.openai.com/api-keys
# 2. Run from repo root:
OPENAI_API_KEY=sk-... npm run gen:portraits

# Useful flags:
OPENAI_API_KEY=sk-... npm run gen:portraits:force                       # regenerate all
OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs --only swordsman   # one species only
OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs --size 1024 --model gpt-image-1
```

- Prompts live in `scripts/portrait-prompts.mjs` — edit any species / rank description, then re-run with `--force` (or delete that one file) to regenerate.
- Cost: gpt-image-1 1024² ≈ **$0.04 / image → ~$2.60 for the full 65-image set**. Re-runs skip existing files unless `--force`.
- Output is square, transparent-background PNG. Game auto-loads on next launch.
- The script throttles to ~1 req/s. Failures are reported per-file; just re-run to fill gaps.

### Alternatives (no API)

Hand-paint or use Midjourney / Stable Diffusion / DALL-E web UI and save with the filenames above.

