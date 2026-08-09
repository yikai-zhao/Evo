// economy-flow-test.js — test coin earning, achievements, vault, daily deal, prestige
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

  // Seed coins via localStorage to test shop/vault/achievements
  await p.evaluate(() => {
    localStorage.setItem('evo_coins', '800');
    localStorage.setItem('evo_vault_v1', '450');
    // inject lifetime stats so achievements can trigger
    localStorage.setItem('evo_lifetime_stats', JSON.stringify({ runs: 9, kills: 200, coins: 500 }));
    // inject a streak at day 6
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(); yest.setUTCDate(yest.getUTCDate()-1);
    localStorage.setItem('evo_login_streak', JSON.stringify({ day: 6, lastClaim: yest.toISOString().slice(0,10) }));
    // 4 species already played
    localStorage.setItem('evo_species_played', JSON.stringify(['wolf','owl','dragon','scorpion']));
  });
  await p.reload({ waitUntil: 'networkidle0' });
  await sleep(1500);

  // 1. Verify seeded state in metaBar
  const metaBar = await p.$eval('#metaBar', el => el.textContent).catch(() => '');
  console.log('MetaBar:', metaBar.trim().substring(0, 200));
  const coins = await p.evaluate(() => typeof getCoins === 'function' ? getCoins() : '?');
  console.log('Coins:', coins);
  assert(coins === 800, `seeded coins did not load: ${coins}`);

  // 2. Claim streak (day 7 → jackpot)
  const streakHandlerReady = await p.$eval('#streakBtn', el => typeof el.onclick === 'function');
  assert(streakHandlerReady, 'streak button handler was not initialized');
  await p.$eval('#streakBtn', el => el.click());
  await sleep(500);
  const streakResult = await p.$eval('#streakBtn', el => el.textContent);
  console.log('Streak btn after claim:', streakResult.trim());
  const coinsAfterStreak = await p.evaluate(() => getCoins());
  console.log('Coins after streak claim:', coinsAfterStreak);
  assert(coinsAfterStreak > coins, 'streak claim did not award coins');

  // 3. Open shop — check daily deal, boost count, cosmetic count, achievements panel
  await p.click('#shopBtn');
  await sleep(800);
  const dealTxt = await p.$eval('#dailyDealBox', el => el.textContent).catch(() => 'N/A');
  console.log('\nDaily Deal:', dealTxt.trim().substring(0, 100));
  const boostCount = await p.$$eval('#boostList > div', els => els.length);
  const cosCount = await p.$$eval('#cosmeticList > div', els => els.length);
  console.log('Boost cards:', boostCount, '| Cosmetic cards:', cosCount);
  assert(boostCount > 0, 'shop has no boost cards');
  assert(cosCount > 0, 'shop has no cosmetic cards');
  const achievPanelTxt = await p.$eval('#achievPanel', el => el.textContent).catch(() => 'MISSING');
  console.log('Achievement panel:', achievPanelTxt.substring(0, 120));
  const prestigeBox = await p.$('#prestigeBox').catch(() => null);
  console.log('Prestige box shown:', !!prestigeBox, '(expected false: not all boosts owned yet)');

  // 4. Buy daily deal
  const dealBtn = await p.$('#dealBuyBtn');
  if (dealBtn) {
    const btnTxt = await p.$eval('#dealBuyBtn', el => el.textContent);
    console.log('\nDeal buy btn:', btnTxt.trim());
    await p.click('#dealBuyBtn');
    await sleep(400);
    const coinsAfterDeal = await p.evaluate(() => getCoins());
    console.log('Coins after deal purchase:', coinsAfterDeal);
  }

  // 5. Buy all 8 boosts to test prestige
  console.log('\nBuying all boosts…');
  await p.evaluate(() => {
    // bypass UI: directly buy all boosts
    for (const def of BOOST_DEFS) {
      if (!getActiveBoosts().includes(def.id)) {
        buyBoost(def.id, { skipCost: true });
      }
    }
  });
  // reopen shop to trigger prestige
  await p.click('#shopCloseBtn');
  await sleep(300);
  await p.click('#shopBtn');
  await sleep(800);
  const prestigeBoxNow = await p.$('#prestigeBox').catch(() => null);
  console.log('Prestige box shown after owning all boosts:', !!prestigeBoxNow);
  assert(!!prestigeBoxNow, 'prestige box missing after all boosts are owned');
  if (prestigeBoxNow) {
    const prestigeTxt = await p.$eval('#prestigeBox', el => el.textContent.substring(0, 100));
    console.log('Prestige text:', prestigeTxt.trim());
  }

  // 6. Test vault panel on death screen
  // First set vault near cap
  await p.evaluate(() => { localStorage.setItem('evo_vault_v1', '580'); });
  await p.click('#shopCloseBtn');
  await sleep(300);

  // Start a run, die quickly, check vault panel shows
  await p.click('.species');
  await sleep(200);
  const selectedSpecies = await p.evaluate(() => typeof G !== 'undefined' ? G.selectedSpecies : null);
  assert(!!selectedSpecies, 'species selection did not register');
  await p.click('#startBtn');
  await p.waitForFunction(() => typeof G !== 'undefined' && G.started === true, { timeout: 5000 });
  // force die
  await p.evaluate(() => {
    if (typeof G !== 'undefined' && G.player){
      G.player._matchRespawnsLeft = 0;
      G.player._revivedOnce = true;
      G.player.hp = 0;
    }
  });
  await sleep(3000);
  const deathVisible = await p.evaluate(() => !document.getElementById('death').classList.contains('hidden'));
  console.log('\nDeath screen visible:', deathVisible);
  assert(deathVisible, 'HP reaching zero did not show the death screen');
  if (deathVisible) {
    const vaultPanel = await p.$('#vaultPanel').catch(() => null);
    const vaultTxt = vaultPanel ? await p.$eval('#vaultPanel', el => el.textContent.substring(0,80)) : 'MISSING';
    console.log('Vault panel:', !!vaultPanel, '|', vaultTxt.trim());
    const achievBanner = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('div'))
        .filter(el => el.textContent.includes('Achievement') && el.textContent.includes('Unlock'))
        .map(el => el.textContent.trim().substring(0, 60));
    });
    console.log('Achievement banners:', achievBanner);
  }

  // 7. Check session run streak bonus
  const sessionRuns = await p.evaluate(() => typeof G !== 'undefined' ? G._sessionRuns : '?');
  console.log('\nSession runs:', sessionRuns);

  await b.close();
  console.log('\nEconomy flow test done.');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
