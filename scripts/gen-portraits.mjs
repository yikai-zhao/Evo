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
const sizeArg = (argv[argv.indexOf('--size')+1]) || '512';  // 512 sufficient for icons, half the cost of 1024
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

const ALL_TARGETS = allTargets();
const targets = ALL_TARGETS.filter(t => !onlySet || onlySet.has(t.key));
let done = 0, skipped = 0, failed = 0;

// Status map for live preview: 'pending' | 'skip' | 'done' | 'fail'
const status = new Map(ALL_TARGETS.map(t => [t.file, 'pending']));

// Generate/update preview.html in OUT_DIR for real-time visual checking
function writePreview() {
  const speciesKeys = [...new Set(ALL_TARGETS.map(t => t.key))];
  const ranks = [1, 3, 5, 7, 9];
  const rows = speciesKeys.map(key => {
    const cols = ranks.map(r => {
      const t = ALL_TARGETS.find(x => x.key === key && x.rank === r);
      if (!t) return '<td></td>';
      const s = status.get(t.file) || 'pending';
      const emoji = { done:'✅', skip:'✔️', fail:'❌', pending:'⏳' }[s];
      const thumb = (s === 'done' || s === 'skip')
        ? `<img src="${t.file}" style="width:96px;height:96px;background:#1a1a2e;display:block;image-rendering:pixelated">`
        : `<div style="width:96px;height:96px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:28px">${emoji}</div>`;
      return `<td style="padding:3px;text-align:center;border:1px solid #333">${thumb}<div style="font-size:10px;color:#888">r${r} ${emoji}</div></td>`;
    }).join('');
    return `<tr><td style="padding:4px 10px;font-weight:bold;color:#eee;white-space:nowrap;border:1px solid #333">${key}</td>${cols}</tr>`;
  }).join('\n');
  const total = ALL_TARGETS.length;
  const ndone = [...status.values()].filter(v=>v==='done'||v==='skip').length;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="4">
<title>Portrait Preview [${ndone}/${total}]</title>
<style>body{background:#0d0d1a;color:#eee;font-family:monospace;padding:16px}h2{margin:0 0 8px}p{margin:4px 0 12px;color:#666;font-size:13px}table{border-collapse:collapse}</style>
</head><body>
<h2>🎮 Evo Portrait Preview — ${ndone}/${total} done — auto-refresh 4s</h2>
<p>Each row = one species. Columns r1→r3→r5→r7→r9 must look progressively BIGGER + MORE POWERFUL.</p>
<table><tr><th style="padding:4px 10px;border:1px solid #444">Species</th><th>r1</th><th>r3</th><th>r5</th><th>r7</th><th>r9</th></tr>
${rows}
</table>
<p>Updated: ${new Date().toLocaleTimeString()}</p>
</body></html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'preview.html'), html);
}

console.log(`Generating ${targets.length} portrait(s) (model=${model}, size=${size}, force=${force})`);
console.log(`Output: ${OUT_DIR}`);

// Mark skipped files in status before writing initial preview
for (const t of targets){
  const out = path.join(OUT_DIR, t.file);
  if (!force && fs.existsSync(out)) status.set(t.file, 'skip');
}
// Seed preview with existing files
for (const t of ALL_TARGETS){
  if (status.get(t.file) === 'pending' && fs.existsSync(path.join(OUT_DIR, t.file)))
    status.set(t.file, 'skip');
}
writePreview();
console.log(`\n  🔍 Open for live preview: file://${OUT_DIR}/preview.html\n`);

for (const t of targets){
  const out = path.join(OUT_DIR, t.file);
  if (!force && fs.existsSync(out)){
    skipped++;
    console.log(`  · skip   ${t.file}`);
    continue;
  }
  process.stdout.write(`  ▸ render ${t.file} ... `);
  try {
    await generate(t);
    done++;
    status.set(t.file, 'done');
    console.log('ok');
  } catch (e){
    failed++;
    status.set(t.file, 'fail');
    console.log('FAIL — ' + e.message);
    await new Promise(r=>setTimeout(r, 1500));
  }
  writePreview();  // update preview after every single image
  await new Promise(r=>setTimeout(r, 800));
}

console.log(`\nDone. generated=${done} skipped=${skipped} failed=${failed}`);
if (failed) process.exit(2);
