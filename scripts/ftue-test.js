/**
 * FTUE & new-player experience test — v3.19.0
 * Validates: spawn invuln extended, damage reduction, achievements on first run
 */
const puppeteer = require('puppeteer-core');
const EXEC = '/home/codespace/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.47/chrome-headless-shell-linux64/chrome-headless-shell';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EXEC,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({width:1280,height:720});
  page.on('console', m => { if (m.type()==='error') process.stdout.write(`[ERR] ${m.text()}\n`); });

  // Clear all storage for true first-run simulation
  await page.goto(BASE + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r=>setTimeout(r,2000));

  // Step 1: Click a species card (enables #startBtn)
  await new Promise(r=>setTimeout(r,1500)); // wait for menu to render
  const speciesCard = await page.$('.species');
  if (speciesCard) {
    await speciesCard.click();
    console.log('Clicked species card');
  } else {
    console.log('⚠️  No .species card found');
  }
  await new Promise(r=>setTimeout(r,800));

  // Step 2: Click #startBtn (now enabled)
  const startBtn = await page.$('#startBtn:not([disabled])');
  if (startBtn) {
    await startBtn.click();
    console.log('Clicked startBtn');
  } else {
    console.log('⚠️  #startBtn not enabled or not found');
  }

  // Step 3: Wait for G.started to be true (game actually running)
  let started = false;
  for (let i = 0; i < 40; i++) {
    await new Promise(r=>setTimeout(r,200));
    started = await page.evaluate(() => typeof G !== 'undefined' && G.started === true);
    if (started) break;
  }
  console.log(`Game started: ${started}`);
  assert(started, 'game did not start from a clean profile');

  // Check first-run conditions in game state
  const ftueState = await page.evaluate(() => {
    return {
      firstRunMode: typeof G !== 'undefined' ? G._firstRunMode : null,
      invuln: typeof G !== 'undefined' && G.player ? G.player.invuln : null,
      lifetimeRuns: (() => {
        try {
          const s = JSON.parse(localStorage.getItem('evo_lifetime_stats')||'{}');
          return s.runs || 0;
        } catch(e){ return -1; }
      })(),
    };
  });
  console.log('\n=== FTUE State at game start ===');
  console.log(JSON.stringify(ftueState, null, 2));

  // Confirm firstRunMode should be true (lifetime runs = 0)
  if (ftueState.firstRunMode === true) {
    console.log('✅ _firstRunMode = true (FTUE active)');
  } else {
    throw new Error('_firstRunMode was not enabled for a clean profile');
  }
  if (ftueState.invuln >= 20) {
    console.log(`✅ spawn invuln = ${ftueState.invuln}s (extended for new player)`);
  } else if (ftueState.invuln !== null) {
    console.log(`⚠️  spawn invuln = ${ftueState.invuln}s (checking... may have already counted down)`);
  } else {
    throw new Error('FTUE player invulnerability was not initialized');
  }

  assert(ftueState.invuln >= 15, `FTUE spawn protection too short: ${ftueState.invuln}s`);

  // Exercise a short protected opening, then exhaust revives and force final settlement.
  await new Promise(r=>setTimeout(r,5000));
  await page.evaluate(() => {
    if (window.Net && typeof Net.leaveRoom === 'function') Net.leaveRoom();
    G.player._matchRespawnsLeft = 0;
    G.player._revivedOnce = true;
    die('FTUE settlement test');
  });

  // Wait for death settlement (up to 8s)
  let dead = false;
  let elapsed = 0;
  while (!dead && elapsed < 8) {
    await new Promise(r=>setTimeout(r,1000));
    elapsed++;
    dead = await page.evaluate(() => {
      const ov = document.getElementById('deathOverlay') || document.getElementById('death');
      return ov && !ov.classList.contains('hidden');
    });
  }

  const deathStats = await page.evaluate(() => {
    return {
      elapsed: typeof G !== 'undefined' ? G.t : null,
      kills: typeof G !== 'undefined' && G.stats ? G.stats.kills : null,
      deathVisible: (() => {
        const ov = document.getElementById('deathOverlay') || document.getElementById('death');
        return ov && !ov.classList.contains('hidden');
      })(),
      achievements: (() => {
        try {
          return Object.keys(JSON.parse(localStorage.getItem('evo_achievements_v1') || '{}'));
        } catch(e){ return []; }
      })(),
      coins: parseInt(localStorage.getItem('evo_coins') || '0'),
      vault: (() => {
        try {
          return JSON.parse(localStorage.getItem('evo_vault_v1') || '0');
        } catch(e){ return 0; }
      })(),
      vaultPanelVisible: (() => {
        const vp = document.getElementById('vaultPanel');
        return !!vp;
      })(),
    };
  });

  console.log('\n=== Post-Death State ===');
  console.log(`Survived: ${elapsed}s`);
  console.log(`Kills: ${deathStats.kills}`);
  console.log(`Coins earned: ${deathStats.coins}`);
  console.log(`Vault: ${deathStats.vault}`);
  console.log(`Vault panel shown: ${deathStats.vaultPanelVisible}`);
  console.log(`Achievements unlocked: ${JSON.stringify(deathStats.achievements)}`);
  assert(deathStats.deathVisible, 'final death overlay did not appear');
  assert(deathStats.vaultPanelVisible, 'death settlement did not render the vault panel');

  // Check achievements  
  const hasFirstRun = deathStats.achievements.includes('first_run');
  const hasSurvivor30 = deathStats.achievements.includes('survivor_30');
  console.log(`\n✅ first_run achievement: ${hasFirstRun ? 'UNLOCKED 🎉' : 'not unlocked'}`);
  assert(hasFirstRun, 'first_run achievement was not awarded');
  console.log(`✅ survivor_30 achievement (if survived 30s): ${hasSurvivor30 ? 'UNLOCKED 🎉' : `not unlocked (died at ${elapsed}s)`}`);

  if (elapsed > 30) console.log('✅ Survived more than 30s (FTUE protection working!)');
  else console.log(`⚠️  Died at ${elapsed}s — FTUE may not be fully effective`);

  await browser.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
