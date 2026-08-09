// deep-death-test.js
'use strict';
const puppeteer = require('puppeteer');
const CHROME = '/home/codespace/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.47/chrome-headless-shell-linux64/chrome-headless-shell';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const b = await puppeteer.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 720 });
  await p.goto(process.env.BASE_URL || 'http://localhost:8080', { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(2000);
  await p.click('.species');
  await sleep(300);
  await p.click('#startBtn');
  await sleep(1000);
  await p.evaluate(() => {
    if (window.Net && typeof Net.leaveRoom === 'function') Net.leaveRoom();
    G.player._matchRespawnsLeft = 0;
    G.player._revivedOnce = true;
    die('Deep death test');
  });

  const start = Date.now();
  let deathShownAt = null;
  let overlayShownAt = null;
  let deathScreen = null;

  for (let i = 0; i < 25; i++) {
    await sleep(400);
    const elapsed = Date.now() - start;

    const state = await p.evaluate(() => {
      if (typeof G === 'undefined') return null;
      return {
        dead: G.dead,
        hp: G.player ? Math.round(G.player.hp) : -1,
        time: Math.round(G.time),
        deathOverlayShown: G._deathOverlayShown,
        deathVisible: !document.getElementById('death').classList.contains('hidden'),
        kills: G.player && G.player.q ? G.player.q.kills : 0,
        rank: G.player ? G.player.rank : 0,
        qi: G.player ? Math.round(G.player.qi) : 0,
      };
    });

    if (!state) continue;

    if (state.dead && deathShownAt === null) {
      deathShownAt = elapsed;
      console.log(`[${elapsed}ms] Player died — HP:${state.hp} kills:${state.kills} rank:${state.rank}`);
    }

    if (state.deathVisible && overlayShownAt === null) {
      overlayShownAt = elapsed;
      console.log(`[${elapsed}ms] Death overlay shown`);

      deathScreen = await p.evaluate(() => {
        const coins = typeof getCoins === 'function' ? getCoins() : '?';
        const vault = typeof getVault === 'function' ? getVault() : '?';
        const newAch = Array.from(document.querySelectorAll('div'))
          .filter(el => el.textContent.includes('Achievement') && el.textContent.includes('Unlocked'))
          .map(el => el.textContent.trim().substring(0, 80));
        return {
          reason: document.getElementById('deathReason').textContent,
          stats: document.getElementById('deathStats').textContent.substring(0, 160),
          coins, vault,
          vaultPanel: !!document.getElementById('vaultPanel'),
          boostPanel: !!document.getElementById('boostOfferPanel'),
          reviveVisible: !document.getElementById('reviveBtn').classList.contains('hidden'),
          coinDblVisible: !document.getElementById('coinDoubleBtn').classList.contains('hidden'),
          restartDisabled: document.getElementById('restartBtn').disabled,
          achievementBanner: newAch,
          sessionRuns: typeof G !== 'undefined' ? G._sessionRuns : '?',
        };
      });
      console.log('\nDeath screen contents:');
      console.log(JSON.stringify(deathScreen, null, 2));
      break;
    }

    // Move and attack to survive longer
    const dirs = ['d', 'w', 'a', 's'];
    await p.keyboard.press(dirs[i % 4]);
    await p.mouse.click(640 + (Math.random() - 0.5) * 400, 360 + (Math.random() - 0.5) * 300);
    await p.keyboard.press('Space');

    if (elapsed > 3000 && elapsed % 5000 < 400) {
      console.log(`  t=${Math.round(elapsed/1000)}s hp:${state.hp}/${130} kills:${state.kills} rank:${state.rank} qi:${state.qi}`);
    }
  }

  assert(overlayShownAt !== null, 'death overlay never showed');
  assert(deathScreen && deathScreen.reason, 'death reason was not rendered');
  assert(deathScreen && deathScreen.stats, 'death stats were not rendered');

  // Wait for restart btn, click, check menu
  await sleep(4000);
  const restartEnabled = await p.evaluate(() => !document.getElementById('restartBtn').disabled);
  console.log('\nRestart btn enabled after 4s:', restartEnabled);
  assert(restartEnabled, 'restart button did not enable after countdown');
  if (restartEnabled) {
    await p.click('#restartBtn');
    await sleep(2500);
    const backToMenu = await p.evaluate(() => !document.getElementById('menu').classList.contains('hidden'));
    console.log('Back to menu:', backToMenu);
    assert(backToMenu, 'restart did not return to the menu');
    if (backToMenu) {
      const coins = await p.evaluate(() => typeof getCoins === 'function' ? getCoins() : '?');
      const achievements = await p.evaluate(() => typeof getAchievements === 'function' ? Object.keys(getAchievements()) : []);
      const shopBtnTxt = await p.$eval('#shopBtn', el => el.textContent);
      const spinBtnTxt = await p.$eval('#spinBtn', el => el.textContent);
      console.log('\nPost-run menu state:');
      console.log('  Coins:', coins);
      console.log('  Achievements earned:', achievements);
      console.log('  ShopBtn:', shopBtnTxt.trim());
      console.log('  SpinBtn:', spinBtnTxt.trim());
    }
  }

  await b.close();
  console.log('\nDone.');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
