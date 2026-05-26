#!/usr/bin/env node
// v3.4.4 — Batch-generate 65 species portraits (13 species × 5 ranks) via OpenAI Images API.
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs            # all missing
//   OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs --force    # regenerate everything
//   OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs --only swordsman,cultivator
//   OPENAI_API_KEY=sk-... node scripts/gen-portraits.mjs --size 1024 --model gpt-image-1
//
// Output: assets/species/<key>[-r3|-r5|-r7|-r9].png  (transparent background, square)
//
// Cost note: gpt-image-1 1024² ≈ $0.04/image → ~$2.60 for all 65. Re-runs only fill missing.

import fs from 'node:fs';
import path from 'node:path';
import { allTargets } from './portrait-prompts.mjs';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('ERROR: OPENAI_API_KEY env var is required.');
  console.error('Get one at https://platform.openai.com/api-keys then re-run:');
  console.error('  OPENAI_API_KEY=sk-... npm run gen:portraits');
  process.exit(1);
}

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const sizeArg = (argv[argv.indexOf('--size')+1]) || '1024';
const model = (argv[argv.indexOf('--model')+1] && argv.indexOf('--model')>=0) ? argv[argv.indexOf('--model')+1] : 'gpt-image-1';
const onlyArg = argv.includes('--only') ? argv[argv.indexOf('--only')+1] : null;
const onlySet = onlyArg ? new Set(onlyArg.split(',').map(s=>s.trim())) : null;
const size = `${sizeArg}x${sizeArg}`;

const OUT_DIR = path.resolve('assets/species');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function generate(target){
  const body = {
    model,
    prompt: target.prompt,
    n: 1,
    size,
    background: 'transparent',
    output_format: 'png',
    quality: 'high',
  };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok){
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt.slice(0,400)}`);
  }
  const json = await res.json();
  const item = json.data && json.data[0];
  if (!item) throw new Error('No image returned: '+JSON.stringify(json).slice(0,300));
  let buf;
  if (item.b64_json){
    buf = Buffer.from(item.b64_json, 'base64');
  } else if (item.url){
    const r = await fetch(item.url);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error('No b64_json or url in response');
  }
  fs.writeFileSync(path.join(OUT_DIR, target.file), buf);
}

const targets = allTargets().filter(t => !onlySet || onlySet.has(t.key));
let done = 0, skipped = 0, failed = 0;
console.log(`Generating ${targets.length} portrait(s) (model=${model}, size=${size}, force=${force})`);
console.log(`Output: ${OUT_DIR}\n`);

for (const t of targets){
  const out = path.join(OUT_DIR, t.file);
  if (!force && fs.existsSync(out)){
    skipped++;
    console.log(`  · skip   ${t.file} (exists)`);
    continue;
  }
  process.stdout.write(`  ▸ render ${t.file} ... `);
  try {
    await generate(t);
    done++;
    console.log('ok');
  } catch (e){
    failed++;
    console.log('FAIL — ' + e.message);
    // brief backoff on transient errors
    await new Promise(r=>setTimeout(r, 1500));
  }
  // throttle to be polite (~1.2 req/s)
  await new Promise(r=>setTimeout(r, 800));
}

console.log(`\nDone. generated=${done} skipped=${skipped} failed=${failed}`);
if (failed) process.exit(2);
