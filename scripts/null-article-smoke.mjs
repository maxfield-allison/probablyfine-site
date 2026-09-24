#!/usr/bin/env node
// Local draft preview only. External requests are blocked, including analytics
// and comments. No production state is read or written by this journey.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';

const base = process.env.NULL_PREVIEW_URL ?? 'http://127.0.0.1:4347';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a loopback preview');
const path = '/blog/why-i-created-null';
const files = ['original-dictation', 'draft', 'assisted-researched', 'version-comparison'];
const ids = ['original', 'edited', 'researched'];
const raw = files.map(file => readFileSync(new URL(`../src/content/article-versions/null/${file}.md`, import.meta.url), 'utf8'));
const body = text => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
const canonical = body(readFileSync(new URL('../src/content/posts/why-i-created-null.md', import.meta.url), 'utf8'));
const noteStart = canonical.lastIndexOf('\n\n**How this one was made.**');
assert.ok(noteStart > 0, 'The canonical post ends with the standard AI-use note');
assert.equal(canonical, body(raw[2]), 'Canonical article and revised download agree, including the AI-use note');
const markdown = await createSatteriMarkdownProcessor({ syntaxHighlight: false, features: { smartPunctuation: false } });
const rendered = await Promise.all(raw.slice(0, 3).map(async text => (await markdown.render(body(text))).code));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const errors = [];
async function context(options = {}) {
  const ctx = await browser.newContext(options);
  await ctx.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  await ctx.addInitScript(() => {
    window.nullEvents = [];
    window.umami = { track: (name, data) => window.nullEvents.push({ name, data }) };
  });
  return ctx;
}
const ctx = await context({ viewport: { width: 1280, height: 960 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(10000);
const reader = page.locator('null-article');
const dialog = page.getByRole('dialog');
const button = id => reader.locator(`[data-version-button="${id}"]`);
const geometry = () => page.evaluate(() => ({
  scroll: window.scrollY,
  height: document.documentElement.scrollHeight,
  tops: [...document.querySelectorAll('[data-passage]')].map(row => row.getBoundingClientRect().top + window.scrollY),
}));
const painted = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function checkOverflow() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal page overflow');
}
async function openPage() {
  await page.goto(base + path);
  await reader.locator('[data-version-button="researched"]').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
}
try {
  await openPage();
  // A draft preview must be noindex; a published article must not be. Set
  // NULL_EXPECT_PUBLISHED=1 when testing the production build.
  const robots = page.locator('meta[name="robots"][content*="noindex"]');
  assert.equal(await robots.count(), process.env.NULL_EXPECT_PUBLISHED === '1' ? 0 : 1);
  assert.equal(await reader.locator('[data-passage]').count(), 23);
  assert.match(await button('researched').textContent(), /Revised article/);
  assert.equal(await reader.locator('#page-ai-note > p > strong').textContent(), 'How this one was made.');
  // Compare the complete rendered text and punctuation, excluding only the UI's
  // explicit empty-passage placeholder. Detect omission, duplication or reorder.
  for (let i = 0; i < ids.length; i++) {
    const actual = await page.evaluate(id => ([...document.querySelectorAll(`[data-cell-version="${id}"]`)].map(cell => [...cell.children].filter(node => !node.classList.contains('empty-passage')).map(node => node.textContent).join('')).join('') + (id === 'researched' ? document.querySelector('#page-ai-note').textContent : '')).replace(/\s+/g, ' ').trim(), ids[i]);
    const expected = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim(), rendered[i]);
    assert.equal(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''), `${ids[i]} preserves the source text in order`);
  }
  for (let i = 0; i < files.length; i++) {
    const response = await ctx.request.get(base + path + '/' + files[i] + '.md');
    assert.equal(response.status(), 200);
    assert.equal(await response.text(), raw[i], `${files[i]} download preserves the snapshot`);
  }
  for (const width of [1280, 375, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-passage="learning-studies"]').getBoundingClientRect().top + scrollY - 240));
    await painted();
    const before = await geometry();
    for (const id of ['original', 'edited', 'researched']) {
      await button(id).click();
      await painted();
      const after = await geometry();
      assert.ok(Math.abs(after.scroll - before.scroll) <= 1, `${width}px ${id}: viewport position stays fixed`);
      assert.equal(after.height, before.height);
      after.tops.forEach((top, i) => assert.ok(Math.abs(top - before.tops[i]) <= 1, `${width}px ${id}: passage ${i + 1} stays aligned`));
      assert.equal(await reader.locator('[data-version-button][aria-pressed="true"]').count(), 1);
      assert.equal(await reader.locator('.version-cell:not([inert])').count(), 23);
      assert.equal(await reader.locator(`.version-cell[data-cell-version="${id}"]:not([aria-hidden])`).count(), 23);
      assert.ok(await reader.locator('.version-toolbar').evaluate(el => el.getBoundingClientRect().top >= 63 && el.getBoundingClientRect().bottom < 240), 'Version controls remain pinned below the site navigation');
    }
    await checkOverflow();
  }
  const compare = reader.locator('[data-passage="learning-studies"] [data-compare-passage]');
  await compare.focus();
  await page.keyboard.press('Enter');
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.locator('[data-dialog-versions] > section').count(), 3);
  assert.match(await dialog.locator('[data-dialog-note]').textContent(), /math and colonoscopy/);
  assert.equal(await page.getByRole('button', { name: 'Close comparison', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, 'Reverse tab stays within the native modal (its scroll container is also focusable)');
  await checkOverflow();
  if (process.env.NULL_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.NULL_SCREENSHOT_DIR}/null-comparison-mobile.png` });
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await compare.evaluate(el => el === document.activeElement), true, 'Escape restores the passage button');
  await button('original').focus();
  await page.keyboard.press('Space');
  assert.equal(await reader.getAttribute('data-version'), 'original');
  const original = reader.locator('[data-passage="learning-studies"] [data-cell-version="original"] p').first();
  await original.click();
  assert.equal(await dialog.isVisible(), true, 'Tapping the original passage opens its comparison');
  await page.getByRole('button', { name: 'Close comparison', exact: true }).click();
  await original.evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); el.click(); });
  assert.equal(await dialog.isVisible(), false, 'Selecting source text does not open a modal');
  await page.evaluate(() => window.getSelection().removeAllRanges());
  await compare.click();
  await page.getByRole('link', { name: 'Read the full comparison document', exact: true }).click();
  assert.equal(await reader.locator('#version-comparison').getAttribute('open'), '');
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await reader.locator('.comparison-body details').count(), 2, 'Full document retains both exact diffs');
  await checkOverflow();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Version comparison .md', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'version-comparison.md');
  await reader.locator('[data-compare-passage="process-note"]').click();
  assert.equal(await dialog.locator('[data-dialog-versions] > section').nth(2).locator('.prose').textContent(), await reader.locator('#page-ai-note').textContent(), 'Process-note comparison includes the complete current disclosure');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.locator('nav[aria-label="Primary"] a[href="/blog"]').first().click();
  await page.waitForURL(/\/blog\/?$/);
  await page.locator(`a[href="${path}"]`).first().click();
  await reader.locator('.version-toolbar').waitFor({ state: 'visible' });
  await page.evaluate(() => { window.nullEvents = []; });
  await button('edited').click();
  await reader.locator('[data-compare-passage]').first().click();
  assert.deepEqual(await page.evaluate(() => window.nullEvents.filter(event => ['post-version', 'post-comparison'].includes(event.name)).map(event => event.name)), ['post-version', 'post-comparison'], 'Client navigation does not duplicate event handlers or counters');
  await page.keyboard.press('Escape');
  // Analytics can be unavailable or throw without breaking reading.
  for (const broken of [false, true]) {
    await page.evaluate(throws => { window.umami = throws ? { track() { throw new Error('Test analytics failure'); } } : undefined; }, broken);
    await button('original').click();
    await compare.click();
    assert.equal(await dialog.isVisible(), true);
    await page.keyboard.press('Escape');
    await button('researched').click();
  }
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (process.env.NULL_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.NULL_SCREENSHOT_DIR}/null-reader-desktop.png` });
  await page.emulateMedia({ media: 'print' });
  assert.equal(await reader.locator('.version-cell:visible').count(), 23);
  assert.equal(await reader.locator('.version-toolbar').isVisible(), false);
  assert.deepEqual(errors, []);
  const noJs = await context({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const plain = await noJs.newPage();
  await plain.goto(base + path);
  assert.equal(await plain.locator('.version-cell:visible').count(), 23);
  assert.equal(await plain.locator('.version-toolbar').isVisible(), false);
  assert.equal(await plain.locator('.document-section a').count(), 4);
  await plain.locator('#version-comparison > summary').click();
  assert.equal(await plain.locator('.comparison-body').isVisible(), true);
  await noJs.close();
  console.log(`PASS (${browser.version()}): source preservation, four downloads, draft noindex, fixed passage positions at 1280/375/320px, keyboard and pointer comparison, modal focus, full diffs, client navigation, analytics failure, print and no-JS fallback`);
} finally {
  await browser.close();
}
