// Run against a built, local candidate. External embeds/analytics are excluded.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const { name } = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const portfolio = name === 'personal-site';
const { chromium } = await import(portfolio ? 'playwright-core' : 'playwright');
const origin =
  process.env.SITE_ORIGIN || `http://127.0.0.1:${portfolio ? 8798 : 8797}`;
const browserPath = process.env.CHROMIUM_PATH;
if (!browserPath)
  throw Error('Set CHROMIUM_PATH to an installed Chromium executable.');
const evidence =
  process.env.RESPONSE_EVIDENCE || '/tmp/site-response-evidence/' + name;
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: browserPath,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const excluded = new Set();
await context.route('**/*', (route) => {
  const url = new URL(route.request().url());
  if (
    url.origin !== origin ||
    url.pathname.startsWith('/pf-insights') ||
    url.pathname.includes('comentario')
  ) {
    excluded.add(url.origin + url.pathname);
    return route.fulfill({
      status: 200,
      contentType:
        route.request().resourceType() === 'script'
          ? 'application/javascript'
          : 'text/plain',
      body: '',
    });
  }
  return route.continue();
});
const page = await context.newPage();
const errors = [];
const transitionCancellations = [];
page.on('pageerror', (e) => {
  // Astro 7.3.4 skips an in-flight native transition during rapid navigation
  // without consuming its ready rejection. Keep this exact diagnostic in the
  // receipt; do not suppress errors in the site or relax functional assertions.
  if (e.message === 'Transition was skipped. skipTransition() called') {
    transitionCancellations.push({ name: e.name, message: e.message, url: page.url() });
  } else errors.push(e.stack || e.message);
});
const results = [];
const ready = () =>
  page.waitForFunction(
    () => document.querySelector('[data-open-trail]')?.disabled === false,
  );
const settled = () => page.waitForFunction(() => !document.documentElement.hasAttribute('data-astro-transition'));
const goto = async (path) => {
  await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
  await ready();
};
async function check(label, run) {
  await run();
  results.push({ label, passed: true });
  console.log('PASS ' + label);
}
const article = portfolio ? '/projects/dnsweaver' : '/blog/how-i-use-ai';
try {
  await check(
    'Home and real Astro navigation mount one response layer',
    async () => {
      await goto('/');
      await page.evaluate(() => {
        window.responseCanary = 'same-document';
      });
      assert.equal(await page.locator('[data-response-root]').count(), 1);
      if (portfolio) {
        const summary = page.locator('.work-disclosure summary').nth(1);
        await summary.focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(
          () =>
            document.querySelectorAll('.work-disclosure')[1].dataset.opened ===
            'true',
        );
        await page
          .locator('.work-summary-content a[href="/projects/dnsweaver"]')
          .click();
      } else {
        await page
          .locator('nav[aria-label="Primary"] a[href="/blog"]')
          .first()
          .click();
        await page.waitForURL('**/blog');
        await ready();
        await page.locator('a[href="/blog/how-i-use-ai"]').first().click();
      }
      await page.waitForURL('**' + article);
      await ready();
      assert.equal(
        await page.evaluate(() => window.responseCanary),
        'same-document',
      );
      assert.equal(await page.locator('[data-reading-tools]').count(), 1);
      assert.ok(await page.locator('[data-reading-tools]').isVisible());
    },
  );
  await check(
    'Section navigation, explicit bookmark and saved-place return',
    async () => {
      assert.equal(
        await page.evaluate(
          () =>
            Object.keys(localStorage).filter((k) =>
              k.startsWith('pf-reading-place:'),
            ).length,
        ),
        0,
      );
      await page.locator('[data-open-contents]').click();
      const first = page.locator('[data-page-sections] a').first();
      const hash = await first.getAttribute('href');
      const sectionText = await first.textContent();
      await first.click();
      await page.waitForFunction(
        () => !document.querySelector('[data-contents-dialog]').open,
      );
      await page.waitForFunction(
        (text) =>
          document.querySelector('[data-current-section]').textContent === text,
        sectionText,
      );
      await page.locator('[data-save-place]').click();
      await page.waitForFunction(() =>
        document
          .querySelector('[data-reading-status]')
          .textContent.includes('Place saved'),
      );
      const saved = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem('pf-reading-place:v1:' + location.pathname),
        ),
      );
      assert.equal(saved.path, article);
      assert.equal('#' + encodeURIComponent(saved.heading), hash);
      await goto('/');
      await page.locator('[data-open-trail]').click();
      assert.equal(await page.locator('[data-saved-places] a').count(), 1);
      await page.locator('[data-saved-places] a').click();
      await page.waitForURL('**' + article + hash);
      await ready();
      assert.ok(page.url().includes(article + hash));
      await settled();
      await page.screenshot({ path: evidence + '/reading.png' });
    },
  );
  await check(
    'Repeated page swaps do not duplicate tools, observers or saved controls',
    async () => {
      for (let i = 0; i < 3; i++) {
        await page
          .locator('nav[aria-label="Primary"] a[href="/"]')
          .first()
          .click();
        await page.waitForURL(origin + '/');
        await ready();
        await page.locator('[data-open-trail]').click();
        await page.locator('[data-saved-places] a').click();
        await page.waitForURL('**' + article + '*');
        await ready();
        assert.equal(await page.locator('[data-reading-tools]').count(), 1);
        assert.equal(await page.locator('[data-response-root]').count(), 1);
      }
      await page.goBack();
      await ready();
      assert.equal(await page.locator('[data-response-root]').count(), 1);
    },
  );
  if (portfolio)
    await check(
      'DNS example preserves the manual record through interruption',
      async () => {
        await goto(article);
        await page.locator('record-flow summary').click();
        const button = page.locator('[data-service-toggle]');
        await button.click();
        await button.click();
        assert.equal(
          await page.locator('[data-owned-record]').textContent(),
          'No managed record',
        );
        assert.ok(
          (await page.locator('.flow-records').textContent()).includes(
            'Manual record · unchanged',
          ),
        );
        await page.screenshot({ path: evidence + '/dns.png' });
      },
    );
  if (!portfolio) {
    await check(
      'Null keeps passage geometry, exposes exploration and restores dialog focus',
      async () => {
        await goto('/blog/why-i-created-null');
        const passage = page.locator('[data-passage]').first();
        const before = await passage.boundingBox();
        await page.locator('[data-compare-passage]').first().click();
        await page.keyboard.press('Escape');
        assert.equal(await passage.getAttribute('data-explored'), 'true');
        assert.ok(
          await page
            .locator('[data-compare-passage]')
            .first()
            .evaluate((el) => el === document.activeElement),
        );
        await page.locator('[data-version-button="original"]').click();
        const after = await passage.boundingBox();
        assert.ok(Math.abs(after.height - before.height) < 1);
        await page.screenshot({ path: evidence + '/null.png' });
      },
    );
    await check(
      'Chronochasm full reload → atlas → source → saved path → site return',
      async () => {
        await goto('/');
        await page.locator('nav a[href="/chronochasm"]').first().click();
        await page.waitForFunction(
          () => document.querySelector('#open-atlas')?.disabled === false,
        );
        await page.locator('#open-atlas').click();
        assert.equal(await page.locator('#atlas .atlas-node').count(), 40);
        assert.equal(await page.locator('#atlas-lines path').count(), 27);
        await page.screenshot({
          path: evidence + '/atlas.png',
          animations: 'disabled',
        });
        await page.locator('#atlas [data-moment="remembering"]').click();
        await page.locator('#story [data-source]').first().click();
        await page.keyboard.press('Escape');
        await page.locator('#reader-path').click();
        await page.locator('#remember-path').check();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(
          () => document.querySelector('#reader-path')?.disabled === false,
        );
        await page.locator('#reader-path').click();
        assert.equal(await page.locator('#path-list li').count(), 1);
        await page.locator('#forget-path').click();
        assert.equal(
          await page.evaluate(() =>
            localStorage.getItem('max-chronochasm-path:v1'),
          ),
          null,
        );
        await goto('/');
        assert.equal(await page.locator('[data-response-root]').count(), 1);
      },
    );
  }
  await check(
    'Reduced motion, 320px reflow and native keyboard controls',
    async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 320, height: 740 });
      await goto(article);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.locator('[data-open-contents]').focus();
      await page.keyboard.press('Enter');
      assert.ok(await page.locator('[data-contents-dialog]').isVisible());
      await page.keyboard.press('Escape');
      assert.ok(
        await page
          .locator('[data-open-contents]')
          .evaluate((el) => el === document.activeElement),
      );
      await page.locator('[data-save-place]').click();
      assert.equal(
        await page.evaluate(
          () =>
            document.querySelector('[data-reading-tools]').getAnimations()
              .length,
        ),
        0,
      );
      await page.screenshot({ path: evidence + '/phone.png' });
      await page.locator('[data-response-still]').check();
      assert.ok(
        await page
          .locator('html')
          .evaluate((el) => el.classList.contains('response-still')),
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    },
  );
  await check('Clear bookmarks leaves unrelated storage intact', async () => {
    await page.evaluate(() =>
      localStorage.setItem('response-test-other', 'keep'),
    );
    await page.locator('[data-open-trail]').click();
    await page.locator('[data-clear-places]').click();
    assert.equal(await page.locator('[data-saved-places] a').count(), 0);
    assert.equal(
      await page.evaluate(() => localStorage.getItem('response-test-other')),
      'keep',
    );
  });
  await check(
    'No JavaScript preserves article and native disclosure reading',
    async () => {
      const plain = await browser.newContext({ javaScriptEnabled: false });
      const p = await plain.newPage();
      await p.goto(origin + article, { waitUntil: 'domcontentloaded' });
      assert.ok(
        (await p.locator('[data-reading-content]').textContent()).length > 100,
      );
      assert.ok(await p.locator('[data-reading-tools]').isHidden());
      if (portfolio) {
        await p.goto(origin + '/');
        await p.locator('.work-disclosure summary').first().click();
        assert.ok(await p.locator('.work-summary-content').first().isVisible());
      } else {
        await p.goto(origin + '/chronochasm');
        assert.ok(await p.locator('.no-script a').isVisible());
      }
      await plain.close();
    },
  );
  assert.deepEqual(errors, []);
  await writeFile(
    evidence + '/verification.json',
    JSON.stringify(
      {
        site: name,
        origin,
        at: new Date().toISOString(),
        browser: browser.version(),
        results,
        errors,
        transitionCancellations,
        excluded: [...excluded],
        limits: [
          'Chromium only',
          'Third-party embeds and analytics excluded',
          'No native screen reader or real device qualification',
        ],
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}
