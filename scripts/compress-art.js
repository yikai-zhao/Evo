#!/usr/bin/env node
// =====================================================================
// compress-art.js — one-shot asset slimming for launch.
// Resizes oversized AI portraits to max 512px and recompresses with
// palette PNG. In-game they render at ≤~300px, so this is lossless in
// practice but cuts ~86MB → ~8MB (critical for Poki/CrazyGames load QA).
//
// Originals are tracked in git — recover any file with:
//   git checkout -- assets/species/<file>.png
// =====================================================================
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIRS = [
  path.join(ROOT, 'assets', 'species'),
  path.join(ROOT, 'assets', 'bosses'),
];
const MAX_DIM = 512;
const MIN_BYTES_TO_TOUCH = 220 * 1024; // skip files already small

(async () => {
  let before = 0, after = 0, touched = 0, skipped = 0;
  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    for (const f of files) {
      const fp = path.join(dir, f);
      const size = fs.statSync(fp).size;
      if (size < MIN_BYTES_TO_TOUCH) { skipped++; continue; }
      before += size;
      const buf = await sharp(fp)
        .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
        .png({ palette: true, quality: 90, compressionLevel: 9, effort: 8 })
        .toBuffer();
      // only write if actually smaller
      if (buf.length < size) {
        fs.writeFileSync(fp, buf);
        after += buf.length;
        touched++;
        console.log(`✓ ${f}: ${(size/1024).toFixed(0)}KB → ${(buf.length/1024).toFixed(0)}KB`);
      } else {
        after += size;
        skipped++;
      }
    }
  }
  console.log(`\nDone. ${touched} compressed, ${skipped} skipped.`);
  console.log(`Total: ${(before/1048576).toFixed(1)}MB → ${(after/1048576).toFixed(1)}MB`);
})().catch(e => { console.error(e); process.exit(1); });
