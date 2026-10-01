// Local build only: external services and same-origin telemetry stay blocked.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.RESPONSIVE_PREVIEW_URL ?? 'http://127.0.0.1:4347';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname));
const artifactDir = process.env.RESPONSIVE_ARTIFACT_DIR;
if (artifactDir) mkdirSync(artifactDir, { recursive: true });
const routes = readdirSync('dist', { recursive: true })
  .filter(file => file.endsWith('.html') && readFileSync(`dist/${file}`, 'utf8').includes('name="generator" content="Astro'))
  .map(file => '/' + file.replace(/index\.html$/, '').replace(/\.html$/, ''));
const widths = [320, 375, 640, 768, 1024, 1440];
const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];
async function context(options = {}) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
  await ctx.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === new URL(base).origin && !/^\/(pf-insights|comentario)/.test(url.pathname)
      ? route.continue() : route.abort();
  });
  return ctx;
}
try {
  const ctx = await context();
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  for (const route of routes) {
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('details').evaluateAll(items => items.forEach(item => { item.open = true; }));
    for (const width of widths) {
      await page.setViewportSize({ width, height: 960 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const state = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        tables: [...document.querySelectorAll('scroll-table')].filter(el => el.checkVisibility()).map(el => {
          const viewport = el.querySelector('.table-viewport');
          return { width: viewport.clientWidth, content: viewport.scrollWidth, focusable: viewport.tabIndex === 0, controls: !el.querySelector('.table-scroll-buttons').hidden };
        }),
      }));
      results.push({ route, width, ...state });
      if (state.pageWidth > width + 1) failures.push(`${route} at ${width}px: page width ${state.pageWidth}`);
      for (const table of state.tables) {
        if (table.content > table.width + 1 && (!table.focusable || !table.controls)) failures.push(`${route} at ${width}px: unreachable table`);
      }
    }
  }
  if (artifactDir) writeFileSync(`${artifactDir}/responsive-results.json`, JSON.stringify({ browser: browser.version(), results, failures }, null, 2));
  console.log(`Audited ${routes.length} pages at ${widths.length} widths; ${failures.length} overflow findings`);
  await page.goto(base + '/blog/why-i-created-null#version-comparison');
  await page.locator('#version-comparison').evaluate(el => { el.open = true; });
  const table = page.locator('#version-comparison scroll-table').nth(1);
  const viewport = table.locator('.table-viewport');
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.evaluate(() => document.fonts.ready);
  await table.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 260));
  assert.ok(await viewport.evaluate(el => el.clientWidth >= 1200), 'Comparison uses the wide desktop measure');
  if (artifactDir) await page.screenshot({ path: `${artifactDir}/comparison-desktop.png` });
  await page.setViewportSize({ width: 375, height: 960 });
  await table.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 260));
  const right = table.getByRole('button', { name: 'Scroll table right' });
  await right.click();
  assert.ok(await viewport.evaluate(el => el.scrollLeft > 0), 'Visible arrow moves the table');
  await table.getByRole('button', { name: 'Scroll table left' }).click();
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelectorAll('#version-comparison .table-viewport')[1].scrollLeft > 0);
  for (let i = 0; i < 10 && await right.isEnabled(); i++) await right.click();
  assert.equal(await right.isDisabled(), true, 'Forward control reaches the last column');
  const left = table.getByRole('button', { name: 'Scroll table left' });
  for (let i = 0; i < 10 && await left.isEnabled(); i++) await left.click();
  if (artifactDir) await page.screenshot({ path: `${artifactDir}/comparison-phone.png` });
  const plainCtx = await context({ javaScriptEnabled: false, viewport: { width: 320, height: 960 } });
  const plain = await plainCtx.newPage();
  await plain.goto(base + '/blog/why-i-created-null');
  await plain.locator('#version-comparison > summary').click();
  const plainTable = plain.locator('#version-comparison scroll-table').nth(1);
  assert.equal(await plainTable.locator('.table-viewport').getAttribute('tabindex'), '0');
  assert.equal(await plainTable.getByText('Scroll sideways to see all columns.').isVisible(), true);
  assert.equal(await plainTable.locator('.table-scroll-buttons').isVisible(), false);
  await plainTable.locator('.table-viewport').focus();
  await plain.keyboard.press('ArrowRight');
  await plain.waitForFunction(() => document.querySelectorAll('#version-comparison .table-viewport')[1].scrollLeft > 0);
  await plainCtx.close();
  if (artifactDir) writeFileSync(`${artifactDir}/responsive-results.json`, JSON.stringify({ browser: browser.version(), results, failures }, null, 2));
  assert.deepEqual(failures, []);
  console.log(`PASS (${browser.version()}): ${routes.length} pages at ${widths.join('/')}px; wide comparison, overflow controls, keyboard and no-JS scrolling`);
} finally {
  await browser.close();
}
