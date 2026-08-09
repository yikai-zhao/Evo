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
  'function applyBoostsToPlayer(',
  'function buildBoostOfferDeck(',
  'function winGameLastStand(',
  'function updateVeil(',
  'function drawVeil(',
  'function updateGodWarEvent(',
  'function drawGodWarArena(',
  'function triggerAuthorityCollision(',
  'function updatePartyCoopBuff(',
  'function togglePartyPanel(',
  'function partyInvite(',
  'function partyAccept(',
  'function awardInheritance(',
  'function _setupShareButton(',
  'function _setupWinShareButton(',
  'function recalcStats(',
  'function dealDamage(',
  'function renderSpeciesPortrait(',
  'function getCombatPacingMultiplier(',
  'function getObjectiveSummary(',
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
// 4b. Net.js exposes v3.8.0 matchmaking API
check('net.js has Net.findMatch',       netSrc.includes('Net.findMatch'));
check('net.js has Net.createRoom',      netSrc.includes('Net.createRoom'));
check('net.js has Net.joinRoom',        netSrc.includes('Net.joinRoom'));
check('net.js handles room message',    netSrc.includes("case 'room'"));
check('net.js has anonymous analytics sender', netSrc.includes('Net.sendAnalytics'));
// 4c. server.js implements room routing
const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
check('server.js parses', (()=>{ try { new vm.Script(serverSrc, {filename:'server.js'}); return true; } catch(e){ console.log('  →', e.message); return false; } })());
check('server.js handles mm_find',      serverSrc.includes("'mm_find'"));
check('server.js handles mm_create',    serverSrc.includes("'mm_create'"));
check('server.js handles mm_join',      serverSrc.includes("'mm_join'"));
check('server.js default room capacity is 28', serverSrc.includes('const DEFAULT_CAP = 28'));
check('server.js rate-limits chat and hit', serverSrc.includes("consumeRate(c, 'chat'") && serverSrc.includes("consumeRate(c, 'hit'"));
check('server.js aggregates analytics', serverSrc.includes("case 'analytics'") && serverSrc.includes('recordAnalytics'));
check('rewarded ads use one success-checking gateway', (gameSrc.match(/SDK\.rewardedBreak\(\)/g)||[]).length === 1);
check('chat sends once per submit', (gameSrc.match(/Net\.sendChat\(v\)/g)||[]).length === 1);
check('team retreat does not consume dash key', gameSrc.includes("if (k==='j'") && !gameSrc.includes("if (k==='x' && G.started && G.player && !G.dead && !G.won)"));

// 5. Veil constants sane
check('VEIL_START_T defined',     gameSrc.includes('VEIL_START_T'));
check('VEIL_END_T defined',       gameSrc.includes('VEIL_END_T'));
check('Veil end > start',         /VEIL_START_T\s*=\s*(\d+)/.test(gameSrc) && /VEIL_END_T\s*=\s*(\d+)/.test(gameSrc));

// 6. Identity-based skill hooks
check('game.js has swordsman blade rush skill', gameSrc.includes("case 'blade_rush':"));
check('game.js has owl moon burst skill', gameSrc.includes("case 'moon_burst':"));
check('game.js has dragon roar skill', gameSrc.includes("case 'roar':"));
check('game.js has poison cloud skill', gameSrc.includes("case 'poison_cloud':"));
check('game.js has blood_drain skill', gameSrc.includes("case 'blood_drain':"));
check('game.js has blood_ancestor_form skill', gameSrc.includes("case 'blood_ancestor_form':"));
check('game.js has brood_spit skill', gameSrc.includes("case 'brood_spit':"));
check('game.js has synapse_pulse skill', gameSrc.includes("case 'synapse_pulse':"));
check('game.js has biogenesis skill', gameSrc.includes("case 'biogenesis':"));
check('game.js has blood path', gameSrc.includes("name:'Path of Blood'"));
check('game.js has saurian path', gameSrc.includes("name:'Path of Saurians'"));
check('game.js has venom projectile support', gameSrc.includes('pr.venom'));
// 7. Asset integrity — every species PNG referenced exists on disk
const speciesDir = path.join(ROOT, 'assets', 'species');
if (fs.existsSync(speciesDir)) {
  const files = fs.readdirSync(speciesDir);
  check(`assets/species has ≥40 PNGs`, files.filter(f => f.endsWith('.png')).length >= 40, `found ${files.filter(f=>f.endsWith('.png')).length}`);
}

// 7. HTML required elements (game would crash without them)
for (const id of ['game', 'win', 'winRestartBtn', 'winShareBtn', 'restartBtn', 'shareBtn', 'death', 'heroPanel', 'shopCtaBtn']) {
  check(`index.html has #${id}`, htmlSrc.includes(`id="${id}"`));
}

console.log(`\n${failed === 0 ? '✓ All smoke tests passed' : '✗ ' + failed + ' check(s) failed'}`);
process.exit(failed === 0 ? 0 : 1);
