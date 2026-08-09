#!/usr/bin/env node
// Automated playtest: opens game, plays through menu → run → death → shop
// Records observations, errors, timing, and UI state at each step.
'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const VIEWPORT_WIDTH = parseInt(process.env.VIEWPORT_WIDTH || '1280', 10);
const VIEWPORT_HEIGHT = parseInt(process.env.VIEWPORT_HEIGHT || '720', 10);
const PLAY_SECONDS = parseInt(process.env.PLAY_SECONDS || '90', 10);
const CPU_THROTTLE = Number(process.env.CPU_THROTTLE || 1);
const MIN_FPS = Number(process.env.MIN_FPS || 30);
const SS_DIR = path.join(__dirname, '../playtest-screenshots');
fs.mkdirSync(SS_DIR, { recursive: true });

const log = (...a) => console.log('[playtest]', ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function ss(page, name) {
  const file = path.join(SS_DIR, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  log(`screenshot → ${name}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/home/codespace/.cache/puppeteer/chrome-headless-shell/linux-151.0.7922.47/chrome-headless-shell-linux64/chrome-headless-shell',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1280,720',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, isMobile: VIEWPORT_WIDTH < 700, hasTouch: VIEWPORT_WIDTH < 700 });
  if (CPU_THROTTLE > 1){
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate:CPU_THROTTLE });
  }

  const errors = [];
  const failedResources = [];
  const consoleLines = [];
  page.on('console', m => consoleLines.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => failedResources.push(`${request.failure()?.errorText || 'FAILED'} ${request.url()}`));

  // ── 1. Load game ──────────────────────────────────────────────────────────
  log('Loading game page…');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: Math.max(20000, 10000 * CPU_THROTTLE) });
  await sleep(1500);
  await ss(page, '01-loading');

  // Wait for menu to appear (loading overlay hides)
  try {
    await page.waitForSelector('#menu:not(.hidden)', { timeout: 8000 });
    log('Menu appeared');
  } catch (e) {
    throw new Error('menu never appeared');
  }
  await sleep(800);
  await ss(page, '02-menu');

  // ── 2. Inspect coin panel & meta bar ──────────────────────────────────────
  const coinCount = await page.$eval('#coinCount', el => el.textContent).catch(() => 'N/A');
  const metaBar = await page.$eval('#metaBar', el => el.textContent).catch(() => 'N/A');
  const shopBtnTxt = await page.$eval('#shopBtn', el => el.textContent).catch(() => 'N/A');
  const spinBtnTxt = await page.$eval('#spinBtn', el => el.textContent).catch(() => 'N/A');
  const streakBtnTxt = await page.$eval('#streakBtn', el => el.textContent).catch(() => 'N/A');
  log(`Coins: ${coinCount}`);
  log(`MetaBar: ${metaBar.trim().substring(0, 120)}`);
  log(`ShopBtn: "${shopBtnTxt.trim()}"`);
  log(`SpinBtn: "${spinBtnTxt.trim()}"`);
  log(`StreakBtn: "${streakBtnTxt.trim()}"`);

  // ── 3. Claim daily streak ─────────────────────────────────────────────────
  log('Clicking streak button…');
  await page.click('#streakBtn');
  await sleep(600);
  const streakResult = await page.$eval('#streakBtn', el => el.textContent).catch(() => '');
  log(`Streak result: "${streakResult.trim()}"`);
  await ss(page, '03-streak-claimed');

  // ── 4. Open shop → check daily deal, boosts, cosmetics, achievements ──────
  log('Opening shop…');
  await page.click('#shopBtn');
  await page.waitForFunction(() => document.querySelectorAll('#boostList > div').length > 0, { timeout:5000 * CPU_THROTTLE });
  await ss(page, '04-shop-open');

  const dealBox = await page.$eval('#dailyDealBox', el => el.textContent).catch(() => 'N/A');
  const boostCount = await page.$$eval('#boostList > div', els => els.length).catch(() => 0);
  const cosCount = await page.$$eval('#cosmeticList > div', els => els.length).catch(() => 0);
  const achievPanel = await page.$eval('#achievPanel', el => el.textContent).catch(() => 'N/A');
  log(`Daily Deal: "${dealBox.trim().substring(0, 80)}"`);
  log(`Boosts in shop: ${boostCount}`);
  log(`Cosmetics in shop: ${cosCount}`);
  log(`Achievements panel length: ${achievPanel.trim().substring(0, 80)}`);
  assert(boostCount > 0, 'shop has no boosts');
  assert(cosCount > 0, 'shop has no cosmetics');
  await page.click('#shopCloseBtn');
  await sleep(400);

  // ── 5. Open spin modal ────────────────────────────────────────────────────
  log('Opening spin modal…');
  await page.click('#spinBtn');
  await sleep(500);
  await ss(page, '05-spin-modal');
  const spinFreeDisabled = await page.$eval('#spinFreeBtn', el => el.disabled).catch(() => null);
  log(`Free spin disabled: ${spinFreeDisabled}`);

  // Do the free spin
  if (!spinFreeDisabled) {
    await page.click('#spinFreeBtn');
    await sleep(1200);
    const spinResult = await page.$eval('#spinResult', el => el.textContent).catch(() => '');
    log(`Spin result: "${spinResult}"`);
    await ss(page, '06-spin-result');
  }
  await page.click('#spinCloseBtn');
  await sleep(300);

  // ── 6. Select species (Wolf — first/unlocked) and start ──────────────────
  log('Selecting Wolf species…');
  // Click first unlocked species card
  const speciesCards = await page.$$('.species');
  assert(speciesCards.length > 0, 'no species cards rendered');
  if (speciesCards.length > 0) {
    await speciesCards[0].click();
    await sleep(300);
    const startBtnDisabled = await page.$eval('#startBtn', el => el.disabled).catch(() => true);
    log(`Start btn disabled: ${startBtnDisabled}`);
    assert(!startBtnDisabled, 'species selection did not enable start');
    await ss(page, '07-species-selected');
  }

  // ── 7. Start the game ─────────────────────────────────────────────────────
  log('Starting game…');
  await page.click('#startBtn').catch(() => page.click('#quickStartBtn'));
  await sleep(3000);
  await ss(page, '08-game-start');

  // Check HUD visibility
  const hudVisible = await page.$eval('#hud', el => !el.classList.contains('hidden')).catch(() => false);
  log(`HUD visible: ${hudVisible}`);
  assert(hudVisible, 'HUD was not visible after starting');

  // Read initial HUD stats
  const hpTxt = await page.$eval('#hpTxt', el => el.textContent).catch(() => 'N/A');
  const evoTxt = await page.$eval('#evoTxt', el => el.textContent).catch(() => 'N/A');
  log(`Initial HP: ${hpTxt}, XP: ${evoTxt}`);

  // ── 8. Simulate 90s of gameplay: WASD + attack spam ──────────────────────
  log(`Simulating ${PLAY_SECONDS} seconds of gameplay…`);
  const canvas = await page.$('#game');
  const canvasBox = canvas ? await canvas.boundingBox() : null;

  // Move and attack in a pattern for 90s
  const moves = [
    { key: 'd', dur: 3000 },
    { key: 's', dur: 3000 },
    { key: 'a', dur: 3000 },
    { key: 'w', dur: 3000 },
  ];
  const startTime = Date.now();
  let tick = 0;
  while (Date.now() - startTime < PLAY_SECONDS * 1000) {
    const move = moves[tick % moves.length];
    await page.keyboard.down(move.key);
    // Attack (space bar)
    await page.keyboard.press('Space');
    if (canvasBox) {
      // Click around to attack
      await page.mouse.click(
        canvasBox.x + canvasBox.width / 2 + (Math.random() - 0.5) * 200,
        canvasBox.y + canvasBox.height / 2 + (Math.random() - 0.5) * 200
      );
    }
    await sleep(200);
    await page.keyboard.up(move.key);
    await sleep(move.dur - 200);
    tick++;

    // Every 20s, take a screenshot and log state
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (elapsed % 20 < 1 && elapsed > 0) {
      const hp2 = await page.$eval('#hpTxt', el => el.textContent).catch(() => '?');
      const xp2 = await page.$eval('#evoTxt', el => el.textContent).catch(() => '?');
      const dead = await page.$eval('#death', el => !el.classList.contains('hidden')).catch(() => false);
      const won  = await page.$eval('#win',   el => !el.classList.contains('hidden')).catch(() => false);
      log(`t=${elapsed}s — HP: ${hp2}, XP: ${xp2}, dead: ${dead}, won: ${won}`);
      await ss(page, `09-gameplay-${elapsed}s`);
      if (dead || won) break;
    }
    // Bail if dead
    const isDead = await page.$eval('#death', el => !el.classList.contains('hidden')).catch(() => false);
    if (isDead) {
      log(`Died at ~${Math.round((Date.now()-startTime)/1000)}s`);
      break;
    }
  }

  await sleep(500);
  await ss(page, '10-after-gameplay');

  // ── 9. Check death screen ─────────────────────────────────────────────────
  const deathVisible = await page.$eval('#death', el => !el.classList.contains('hidden')).catch(() => false);
  log(`Death screen visible: ${deathVisible}`);
  if (deathVisible) {
    const deathStats = await page.$eval('#deathStats', el => el.textContent).catch(() => 'N/A');
    const deathReason = await page.$eval('#deathReason', el => el.textContent).catch(() => 'N/A');
    const vaultPanel = await page.$('#vaultPanel').catch(() => null);
    const boostPanel = await page.$('#boostOfferPanel').catch(() => null);
    const achievUnlock = await page.$eval('body', el => el.querySelector('[style*="Achievement"]')?.textContent || 'none').catch(() => 'none');
    log(`Death reason: "${deathReason}"`);
    log(`Death stats: "${deathStats.substring(0, 120)}"`);
    log(`Vault panel present: ${!!vaultPanel}`);
    log(`Boost offer panel present: ${!!boostPanel}`);
    log(`Achievement unlock: "${achievUnlock.substring(0, 60)}"`);
    await ss(page, '11-death-screen');

    // Check revive button
    const reviveVisible = await page.$eval('#reviveBtn', el => !el.classList.contains('hidden')).catch(() => false);
    const coinDoubleVisible = await page.$eval('#coinDoubleBtn', el => !el.classList.contains('hidden')).catch(() => false);
    log(`Revive btn visible: ${reviveVisible}`);
    log(`CoinDouble btn visible: ${coinDoubleVisible}`);
  }

  // ── 10. Check restart → back to menu ─────────────────────────────────────
  if (deathVisible) {
    log('Waiting for restart button to become enabled…');
    await sleep(3500); // 3s countdown
    const restartEnabled = await page.$eval('#restartBtn', el => !el.disabled).catch(() => false);
    log(`Restart btn enabled: ${restartEnabled}`);
    assert(restartEnabled, 'restart button did not enable after death');
    await page.click('#restartBtn');
    await sleep(2000);
    await ss(page, '12-back-to-menu');
    const menuBack = await page.$eval('#menu', el => !el.classList.contains('hidden')).catch(() => false);
    log(`Back to menu: ${menuBack}`);
    // Check if metaBar updated
    const metaBar2 = await page.$eval('#metaBar', el => el.textContent).catch(() => 'N/A');
    log(`MetaBar after run: ${metaBar2.trim().substring(0, 150)}`);
  }

  // ── 11. Collect JS errors ─────────────────────────────────────────────────
  log('\n=== JS Errors encountered ===');
  if (errors.length === 0) log('(none)');
  errors.forEach((e, i) => log(`  [${i+1}] ${e.substring(0, 200)}`));

  log('\n=== Console warnings/errors ===');
  const warned = consoleLines.filter(l => l.includes('[error]') || l.includes('[warning]'));
  if (warned.length === 0) log('(none)');
  warned.slice(0, 20).forEach(l => log(' ', l.substring(0, 160)));

  assert(errors.length === 0, `JavaScript errors: ${errors.join(' | ')}`);
  assert(failedResources.length === 0, `resource failures: ${failedResources.join(' | ')}`);
  const runtime = await page.evaluate(() => typeof G === 'undefined' ? null : ({ fps:G.fps, errorCount:G.errorCount || 0, started:G.started }));
  assert(runtime && runtime.errorCount === 0, `game loop recovered from ${runtime ? runtime.errorCount : 'unknown'} errors`);
  if (runtime.started && !deathVisible) assert(runtime.fps >= MIN_FPS, `runtime FPS ${runtime.fps} below ${MIN_FPS}`);
  log(`Runtime FPS: ${runtime.fps} (CPU throttle ${CPU_THROTTLE}x)`);
  const finalUiAvailable = deathVisible || await page.$eval('#hud', el => !el.classList.contains('hidden')).catch(() => false);
  assert(finalUiAvailable, 'neither gameplay HUD nor death settlement was available at the end');

  await ss(page, '13-final');
  await browser.close();
  log('\nPlaytest complete. Screenshots in:', SS_DIR);
})().catch(err => {
  console.error('[playtest FATAL]', err);
  process.exit(1);
});
