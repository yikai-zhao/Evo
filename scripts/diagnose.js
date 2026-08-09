// diagnose.js — check 404s, canvas, and deep gameplay state
'use strict';
const puppeteer = require('puppeteer');
const CHROME = '/home/codespace/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.47/chrome-headless-shell-linux64/chrome-headless-shell';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 720 });

  const failed = [];
  p.on('requestfailed', r => failed.push(r.url() + ' → ' + r.failure().errorText));
  p.on('response', r => { if (r.status() === 404) failed.push('404: ' + r.url()); });

  await p.goto(process.env.BASE_URL || 'http://localhost:8080', { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);

  console.log('\n--- Failed/404 resources ---');
  failed.slice(0, 20).forEach(x => console.log(' ', x));
  if (failed.length === 0) console.log('  (none)');

  // canvas status
  const cvs = await p.evaluate(() => {
    const c = document.getElementById('game');
    if (!c) return 'no #game canvas';
    const ctx = c.getContext('2d');
    return ctx ? 'canvas 2d ok' : 'canvas 2d fail';
  });
  console.log('\nCanvas:', cvs);

  // game state at load
  const gameState = await p.evaluate(() => {
    if (typeof G === 'undefined') return 'G not defined';
    return JSON.stringify({
      version: typeof VERSION !== 'undefined' ? VERSION : '?',
      soundOn: G.soundOn,
      started: G.started,
      selectedSpecies: G.selectedSpecies,
    });
  });
  console.log('Game state:', gameState);

  // select wolf and start, then let run for 60s
  await p.click('.species').catch(() => {});
  await sleep(300);
  await p.click('#startBtn').catch(() => p.click('#quickStartBtn').catch(() => {}));
  await sleep(2000);

  console.log('\n--- After start ---');
  const started = await p.evaluate(() => typeof G !== 'undefined' ? G.started : false);
  const enemies = await p.evaluate(() => typeof G !== 'undefined' ? G.enemies.length : -1);
  const playerHp = await p.evaluate(() => typeof G !== 'undefined' && G.player ? G.player.hp : -1);
  console.log('G.started:', started, '| enemies:', enemies, '| player.hp:', playerHp);

  // Follow the actual first-hunt target and attack it for up to 60s.
  const t0 = Date.now();
  let firstKillAt = null;
  let tier2At = null;
  while (Date.now() - t0 < 60000) {
    const target = await p.evaluate(() => {
      if (typeof G === 'undefined' || !G.player || typeof getFirstHuntTarget !== 'function') return null;
      const e = getFirstHuntTarget();
      if (!e) return null;
      return {
        sx: e.x - G.cam.x + innerWidth/2,
        sy: e.y - G.cam.y + innerHeight/2,
        dx: e.x - G.player.x,
        dy: e.y - G.player.y,
      };
    });
    if (target){
      await p.mouse.move(Math.max(1, Math.min(1279, target.sx)), Math.max(1, Math.min(719, target.sy)));
      const keys = [];
      if (target.dx > 75) keys.push('d'); else if (target.dx < -75) keys.push('a');
      if (target.dy > 75) keys.push('s'); else if (target.dy < -75) keys.push('w');
      for (const key of keys) await p.keyboard.down(key);
      await sleep(140);
      for (const key of keys) await p.keyboard.up(key);
    }
    await p.keyboard.press('Space');
    await sleep(220);
    const progress = await p.evaluate(() => ({ kills:G.player.q.kills||0, rank:G.player.rank||1 }));
    const elapsedS = (Date.now()-t0)/1000;
    if (progress.kills>0 && firstKillAt===null) firstKillAt = elapsedS;
    if (progress.rank>=2 && tier2At===null) tier2At = elapsedS;
    if (firstKillAt!==null && tier2At!==null) break;
    const isDead = await p.evaluate(() => typeof G !== 'undefined' ? G.dead : false);
    if (isDead) { console.log('Died at', Math.round((Date.now()-t0)/1000)+'s'); break; }
    // log every 15s
    const elapsed = Math.round((Date.now()-t0)/1000);
    if (elapsed % 15 === 0 && elapsed > 0) {
      const snap = await p.evaluate(() => {
        if (typeof G === 'undefined' || !G.player) return null;
        return {
          hp: Math.round(G.player.hp),
          maxHp: G.player.maxHp,
          rank: G.player.rank,
          kills: G.player.q ? G.player.q.kills : 0,
          qi: Math.round(G.player.qi),
          time: Math.round(G.time),
          enemies: G.enemies.length,
        };
      });
      console.log(`  t=${elapsed}s:`, JSON.stringify(snap));
    }
  }
  console.log(`First kill: ${firstKillAt===null?'missing':firstKillAt.toFixed(1)+'s'} | Tier 2: ${tier2At===null?'missing':tier2At.toFixed(1)+'s'}`);

  // Deep state snapshot at end
  console.log('\n--- Final game state ---');
  const finalSnap = await p.evaluate(() => {
    if (typeof G === 'undefined') return {};
    const p = G.player || {};
    return {
      dead: G.dead, won: G.won,
      time: Math.round(G.time),
      rank: p.rank,
      kills: p.q ? p.q.kills : 0,
      bossKilled: p.q ? p.q.bossKilled : 0,
      hp: Math.round(p.hp), maxHp: p.maxHp,
      coins: typeof getCoins === 'function' ? getCoins() : '?',
      vault: typeof getVault === 'function' ? getVault() : '?',
      achievements: typeof getAchievements === 'function' ? Object.keys(getAchievements()) : [],
    };
  });
  console.log(JSON.stringify(finalSnap, null, 2));

  // Check death screen completeness
  const deathCheck = await p.evaluate(() => {
    const d = document.getElementById('death');
    if (!d || d.classList.contains('hidden')) return 'death hidden';
    return {
      visible: true,
      reason: document.getElementById('deathReason')?.textContent,
      stats: document.getElementById('deathStats')?.textContent?.substring(0, 100),
      hasVault: !!document.getElementById('vaultPanel'),
      hasBoostOffer: !!document.getElementById('boostOfferPanel'),
      hasAchiev: !!document.querySelector('[id^="achievPanel"]') ||
                 Array.from(document.querySelectorAll('div')).some(el => el.textContent.includes('Achievement')),
      reviveVisible: !document.getElementById('reviveBtn')?.classList.contains('hidden'),
      coinDoubleVisible: !document.getElementById('coinDoubleBtn')?.classList.contains('hidden'),
    };
  });
  console.log('\n--- Death screen ---');
  console.log(JSON.stringify(deathCheck, null, 2));

  // check supply drop button state
  const supplyBtn = await p.evaluate(() => {
    const b = document.getElementById('supplyDropBtn');
    return { exists: !!b, hidden: b ? b.classList.contains('hidden') : 'n/a' };
  });
  console.log('\nSupply drop btn:', JSON.stringify(supplyBtn));

  await b.close();
  if (failed.length){
    console.error('Late resource failures:', failed.join('\n  '));
    throw new Error(`resource failures: ${failed.length}`);
  }
  if (firstKillAt===null || firstKillAt>30) throw new Error('first kill pacing failed');
  if (tier2At===null || tier2At>60) throw new Error('first evolution pacing failed');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
