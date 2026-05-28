#!/usr/bin/env node
// =====================================================================
// Sync ?v= cache-bust across index.html from package.json version.
// Run this before every commit/build so browser caches always invalidate.
// Usage:  node scripts/sync-version.js [--check]
//   --check  exits non-zero if any ?v= doesn't match package.json (CI guard)
// =====================================================================
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = pkg.version;
const CHECK_ONLY = process.argv.includes('--check');

const FILES = ['index.html'];
const RE = /\?v=\d+\.\d+\.\d+(?:[-+][\w.]+)?/g;

let drift = 0;
let touched = 0;
for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const src = fs.readFileSync(full, 'utf8');
  const matches = src.match(RE) || [];
  const target = `?v=${VERSION}`;
  const out = src.replace(RE, target);
  const stale = matches.filter(m => m !== target).length;
  if (stale > 0) {
    drift += stale;
    if (CHECK_ONLY) {
      console.error(`✗ ${rel}: ${stale} cache-bust string(s) don't match package.json v${VERSION}`);
    } else {
      fs.writeFileSync(full, out);
      console.log(`✓ ${rel}: updated ${stale} cache-bust string(s) → ?v=${VERSION}`);
      touched++;
    }
  } else {
    console.log(`✓ ${rel}: already at ?v=${VERSION}`);
  }
}

if (CHECK_ONLY && drift > 0) {
  console.error(`\nRun:  npm run version:sync`);
  process.exit(1);
}
if (!CHECK_ONLY) console.log(`\nDone. Touched ${touched} file(s) at v${VERSION}.`);
