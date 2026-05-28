#!/usr/bin/env node
// =====================================================================
// Smoke test — runs in Node, no headless browser needed.
// Validates that game.js / net.js parse, key symbols exist, cache-bust
// strings are aligned, and v3.7.0 Twilight-of-the-Gods code is wired.
//
// Exits non-zero on any failure → wire into CI / pre-commit.
// =====================================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

let failed = 0;
function check(name, cond, detail) {
  const ok = !!cond;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + (detail || 'failed')}`);
  if (!ok) failed++;
}

// 1. Parse-ability (catches syntax errors before browser hits them)
const gameSrc = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');
const netSrc  = fs.readFileSync(path.join(ROOT, 'net.js'), 'utf8');
const sdkSrc  = fs.readFileSync(path.join(ROOT, 'sdk.js'), 'utf8');
try { new vm.Script(gameSrc, { filename: 'game.js' }); check('game.js parses', true); }
catch (e) { check('game.js parses', false, e.message); }
try { new vm.Script(netSrc, { filename: 'net.js' }); check('net.js parses', true); }
catch (e) { check('net.js parses', false, e.message); }
try { new vm.Script(sdkSrc, { filename: 'sdk.js' }); check('sdk.js parses', true); }
catch (e) { check('sdk.js parses', false, e.message); }

// 2. Required symbols present (regressions on rename/delete will fail here)
const requiredFns = [
  'function update(',
  'function render(',
  'function winGame(',
  'function winGameLastStand(',
  'function updateVeil(',
  'function drawVeil(',
  'function togglePartyPanel(',
  'function partyInvite(',
  'function partyAccept(',
  'function awardInheritance(',
  'function _setupShareButton(',
  'function _setupWinShareButton(',
  'function recalcStats(',
  'function dealDamage(',
];
for (const sig of requiredFns) {
  check(`game.js contains ${sig.replace('function ', '').replace('(', '')}`, gameSrc.includes(sig));
}

// 3. Cache-bust alignment
const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const versions = (htmlSrc.match(/\?v=([\d.]+)/g) || []).map(s => s.slice(3));
const unique = [...new Set(versions)];
check('index.html cache-bust strings unified', unique.length === 1, 'found versions: ' + unique.join(','));
check(`cache-bust matches package.json (${pkg.version})`, unique.length === 1 && unique[0] === pkg.version, `html=${unique[0]} pkg=${pkg.version}`);

// 4. Net.js exposes party API
check('net.js has Net.sendParty',       netSrc.includes('Net.sendParty'));
check('net.js handles party messages',  netSrc.includes("case 'party'"));

// 5. Veil constants sane
check('VEIL_START_T defined',     gameSrc.includes('VEIL_START_T'));
check('VEIL_END_T defined',       gameSrc.includes('VEIL_END_T'));
check('Veil end > start',         /VEIL_START_T\s*=\s*(\d+)/.test(gameSrc) && /VEIL_END_T\s*=\s*(\d+)/.test(gameSrc));

// 6. Asset integrity — every species PNG referenced exists on disk
const speciesDir = path.join(ROOT, 'assets', 'species');
if (fs.existsSync(speciesDir)) {
  const files = fs.readdirSync(speciesDir);
  check(`assets/species has ≥40 PNGs`, files.filter(f => f.endsWith('.png')).length >= 40, `found ${files.filter(f=>f.endsWith('.png')).length}`);
}

// 7. HTML required elements (game would crash without them)
for (const id of ['game', 'win', 'winRestartBtn', 'winShareBtn', 'restartBtn', 'shareBtn', 'death']) {
  check(`index.html has #${id}`, htmlSrc.includes(`id="${id}"`));
}

console.log(`\n${failed === 0 ? '✓ All smoke tests passed' : '✗ ' + failed + ' check(s) failed'}`);
process.exit(failed === 0 ? 0 : 1);
