#!/usr/bin/env node
// Run against a loopback preview built with PUBLIC_ARCADE_ORIGIN pointing at
// the locally served runtime. Each run gets disposable browser storage.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base = process.env.ARCADE_SITE_URL ?? 'http://localhost:4324';
const browser = await chromium.launch({
  headless:true,
  ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {}),
});
const context = await browser.newContext({viewport:{width:1280,height:1000}});
// Capture the documented js-dos command interface without adding a test API
// to the shipped runtime. Delegate every event to the real player unchanged.
await context.addInitScript(() => {
  Object.defineProperty(window, 'Dos', {configurable:true, set(create) {
    Object.defineProperty(window, 'Dos', {configurable:true, writable:true, value:(element, options) => create(element, {
      ...options,
      onEvent(event, detail) {
        if (event === 'ci-ready') window.arcadeTestCi = detail;
        options.onEvent?.(event, detail);
      },
    })});
  }});
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const runtimeRequests = [];
page.on('request', request => {
  if (request.url().includes('/arcade/assets/') || request.url().includes('/arcade/runtime/')) runtimeRequests.push(request.url());
});
async function launch() {
  await page.locator('[data-launch]').click();
  const frame = await page.locator('[data-stage] iframe').elementHandle().then(el => el.contentFrame());
  await frame.waitForFunction(() => window.arcadeTestCi, undefined, {timeout:45000});
  return frame;
}
try {
  await page.goto(base + '/blog');
  assert.equal(await page.evaluate(() => crossOriginIsolated), false);
  await page.locator('nav[aria-label="Primary"] a[href="/arcade"]').first().click();
  await page.waitForURL(/\/arcade\/?$/);
  assert.equal(await page.evaluate(() => crossOriginIsolated), true, 'Entering the arcade must apply its isolation headers');
  assert.equal(await page.locator('[data-game-platform]').count(), 12);
  assert.equal(await page.locator('iframe').count(), 0);
  assert.equal(runtimeRequests.length, 0, 'The collection must not load emulators or game disks');
  for (const [platform, count] of [['Macintosh',4],['Windows',2],['DOS',6],['All',12]]) {
    await page.locator(`[data-filter="${platform}"]`).click();
    assert.equal(await page.locator('[data-game-platform]:visible').count(), count);
  }
  await page.goto(base + '/arcade/hocus-pocus');
  assert.equal(await page.locator('iframe').count(), 0);
  let frame = await launch();
  await frame.evaluate(async () => {
    await window.arcadeTestCi.fsWriteFile('ARCADE-CHECK.TXT', new TextEncoder().encode('saved across a player restart'));
  });
  await page.locator('[data-save]').click();
  await page.waitForFunction(() => document.querySelector('[data-player-status]').textContent.includes('Disk changes saved'));
  await page.locator('[data-pause]').click();
  assert.equal(await page.locator('[data-pause]').innerText(), 'Resume');
  await page.locator('[data-pause]').click();
  assert.equal(await page.locator('[data-pause]').innerText(), 'Pause');
  await page.locator('[data-fullscreen]').click();
  await page.waitForFunction(() => document.fullscreenElement?.hasAttribute('data-arcade-player'));
  assert.equal(await page.evaluate(() => document.fullscreenElement?.hasAttribute('data-arcade-player')), true);
  await page.locator('[data-fullscreen]').click();
  await page.locator('[data-stop]').click();
  assert.equal(await page.locator('iframe').count(), 0);
  assert.equal(frame.isDetached(), true);
  frame = await launch();
  const restored = await frame.evaluate(async () => new TextDecoder().decode(await window.arcadeTestCi.fsReadFile('ARCADE-CHECK.TXT')));
  assert.equal(restored, 'saved across a player restart');
  await page.locator('.arcade-back').click();
  await page.waitForURL(/\/arcade\/?$/);
  assert.equal(await page.locator('iframe').count(), 0);
  assert.equal(frame.isDetached(), true);
  await page.locator('nav[aria-label="Primary"] a[href="/blog"]').first().click();
  await page.waitForURL(/\/blog\/?$/);
  assert.equal(await page.evaluate(() => crossOriginIsolated), false, 'Leaving the arcade must restore the normal blog context');
  assert.deepEqual(errors, []);
  console.log('PASS: isolation boundary, lazy loading, filters, pause, fullscreen, stop, persisted DOS disk changes and navigation cleanup');

  await context.route('**/hocus-pocus/bundle.json', route => route.fulfill({status:503,body:'Test outage'}));
  await page.goto(base + '/arcade/hocus-pocus');
  await page.locator('[data-launch]').click();
  await page.waitForFunction(() => document.querySelector('[data-player-status]').textContent.includes('unavailable'));
  assert.equal(await page.locator('[data-player-help]').isVisible(), true);
  await page.locator('[data-stop]').click();
  await context.unroute('**/hocus-pocus/bundle.json');
  await launch();
  await page.locator('[data-stop]').click();
  console.log('PASS: failed download and retry');

  await page.goto(base + '/arcade/taskmaker');
  await page.locator('[data-launch]').click();
  await page.waitForTimeout(20000);
  const mac = page.frames().find(frame => frame !== page.mainFrame());
  const screen = mac.locator('canvas');
  await page.locator('[data-pause]').click();
  await page.waitForTimeout(500);
  const pausedScreen = await screen.screenshot();
  const otherTab = await context.newPage();
  await otherTab.goto('about:blank');
  await otherTab.bringToFront();
  await page.bringToFront();
  await screen.click({position:{x:300,y:300}});
  await page.keyboard.press('Meta+n', {delay:150});
  await page.waitForTimeout(500);
  assert.deepEqual(await screen.screenshot(), pausedScreen, 'A paused Mac must ignore input after returning to the tab');
  await page.locator('[data-pause]').click();
  await screen.click({position:{x:300,y:300}});
  await page.keyboard.press('Meta+n', {delay:150});
  await page.waitForTimeout(1000);
  assert.notDeepEqual(await screen.screenshot(), pausedScreen, 'Resume must restore Mac input');
  await otherTab.close();
  await page.locator('[data-stop]').click();
  console.log('PASS: Mac manual pause survives a tab switch and Resume restores input');

  await context.route('**/armor.hfv.json', route => route.fulfill({status:503,body:'Test disk outage'}));
  await page.goto(base + '/arcade/armor');
  await page.locator('[data-launch]').click();
  await page.waitForFunction(() => document.querySelector('[data-player-status]').textContent.includes('could not load'));
  await page.waitForTimeout(18000);
  assert.match(await page.locator('[data-player-status]').innerText(), /could not load/);
  assert.equal(await page.locator('[data-player-help]').isVisible(), true);
  await page.locator('[data-stop]').click();
  console.log('PASS: Mac disk failure remains visible after the system boots');
} finally {
  await browser.close();
}
