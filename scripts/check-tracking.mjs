// Fail the build when the analytics drift away from what the privacy page says,
// or when an internal link is instrumented in the way that breaks navigation.
//
// Two promises are enforced here, both of which were kept by remembering until
// now, and remembering is what check-ai-notes.mjs exists to prove does not work.
//
// 1. THE PRIVACY PAGE IS A PROMISE, NOT A DESCRIPTION. src/pages/privacy.astro
//    says in its own header comment: "the event list is the actual set of
//    data-umami-event attributes in src/ plus the umami.track() calls in
//    public/js/, not a summary of them ... If you change what is collected,
//    change this page in the same commit." An event added without that edit
//    makes the page quietly false, and a privacy page that is quietly false is
//    worse than none. So the set of event names in the source must equal the
//    set declared below, and the declared set is what the page was written
//    against. Adding an event means editing this file, which means seeing this
//    comment, which means updating the page and its log.
//
// 2. INTERNAL LINKS MUST NOT CARRY data-umami-event. Umami's click handler
//    calls preventDefault() on any <a> with that attribute and re-navigates via
//    `location.href` once the request settles. Both sites run Astro's
//    ClientRouter, so doing that to an internal link downgrades a client-side
//    view transition into a full page load, and delays the click behind a
//    network round trip. Internal links use the `data-track` namespace and
//    public/js/interactions.js instead, which reports without touching
//    navigation. Outbound and mailto links are fine either way: they leave the
//    site, so there is no transition to lose.
//
// Runs from prebuild.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Every event this site is allowed to send, and what it means. Keep it
// alphabetical. Changing this list means changing the privacy page.
const DECLARED = new Set([
  'ai-role-chip',      // the AI-role label on a post, opening /ai
  'arcade-play',       // an emulator was started (props: title, kind)
  'arcade-stop',       // the emulator was stopped again (props: title)
  'email-click',       // a mailto link
  'nav-menu',          // the mobile disclosure menu was opened
  'note-read',         // the process note scrolled into view (post-signals.js)
  'outbound-arcade',   // an external link on /arcade
  'outbound-bluesky',
  'outbound-facebook',
  'outbound-github',
  'outbound-linkedin',
  'outbound-maxfieldallison',
  'outbound-nowpage',  // nownownow.com, from /now
  'outbound-status',   // the status page link on the home page
  'photo-browse',      // moved between photos inside the lightbox
  'photo-open',        // a photo was opened (props: where)
  'post-nav',          // older / newer at the foot of a post (props: dir)
  'post-open',         // entered a post from a listing (props: where)
  'post-outbound',     // a source link inside an article (post-signals.js)
  'post-read',         // reached the end of a post (read-tracker.js)
  'post-tag',          // a tag chip (props: tag, where)
  'rss-subscribe',
  'skip-link',         // skip-to-content was used
  'tag-open',          // a tag from the tag index (props: tag)
]);

// No dynamic event families on this site today. The machinery is kept so the two
// sites' checkers stay diffable, and so a family added later has to be declared
// here rather than appearing unannounced.
const DECLARED_PREFIXES = [];

const files = [];
for (const dir of ['src', 'public/js']) {
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(astro|ts|js|mjs)$/.test(name)) files.push(full);
    }
  };
  walk(join(root, dir));
}

const problems = [];
const seen = new Set();

// An <a> whose href is an internal ROUTE: starts with / or #, or is a template
// literal building a site path. Anything http(s) or mailto leaves the site, and
// so does a link straight to a file - /rss.xml and /resume.pdf are downloads or
// feeds, not pages the router transitions to, so instrumenting them
// declaratively costs nothing.
const INTERNAL_HREF = /href=\{?["'`]?[/#]/;
const FILE_HREF = /href=\{?["'`]?[^"'`\s>]*\.(xml|pdf|json|txt|zip|png|jpg|svg|ico)\b/;

for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');

  for (const m of text.matchAll(/data-umami-event=["']([a-z0-9-]+)["']/g)) seen.add(m[1]);
  for (const m of text.matchAll(/\bdata-track=["']([a-z0-9-]+)["']/g)) seen.add(m[1]);
  // umami.track('name', …) in the static scripts.
  for (const m of text.matchAll(/umami\.track\(\s*["'`]([a-z0-9-]+)["'`]/g)) seen.add(m[1]);
  // The arcade stop button is built in script, so its name is set via dataset.
  for (const m of text.matchAll(/dataset\.umamiEvent\s*=\s*["'`]([a-z0-9-]+)["'`]/g)) {
    seen.add(m[1]);
  }
  // post-signals.js tags body links by setting the attribute directly.
  for (const m of text.matchAll(
    /setAttribute\(\s*["'`]data-umami-event["'`]\s*,\s*["'`]([a-z0-9-]+)["'`]/g)) {
    seen.add(m[1]);
  }
  // Names built from a content id: `case-study-${project.id}`. The scanner cannot
  // know the ids, so it records the literal prefix as a family (`case-study-*`)
  // and DECLARED_PREFIXES is what makes that family legal. Without this the
  // template-literal names were invisible, the prefix list was decorative, and a
  // whole family of events could appear with nothing checking it.
  for (const m of text.matchAll(
    /(?:data-umami-event|data-track)=\{`([a-z0-9-]+)\$\{/g)) {
    seen.add(`${m[1]}*`);
  }
  // Nav links and home tiles carry their event name as an object property in a
  // data array (`umami: 'outbound-status'`), never as a literal attribute. Those
  // were invisible to this scanner until they were not, which would have let a
  // nav event exist that the privacy page never mentioned - exactly the drift
  // this file is here to stop.
  for (const m of text.matchAll(/\bumami:\s*["'`]([a-z0-9-]+)["'`]/g)) seen.add(m[1]);
  // <ReadTracker event="post-read" …/> names its event as a component prop.
  for (const m of text.matchAll(/<ReadTracker\b[^>]*\bevent=["']([a-z0-9-]+)["']/g)) {
    seen.add(m[1]);
  }

  // Rule 2. Look at each opening <a …> as a whole so href and attribute are
  // judged together.
  for (const m of text.matchAll(/<a\b([^>]*)>/g)) {
    const attrs = m[1];
    if (!/data-umami-event=/.test(attrs)) continue;
    const line = text.slice(0, m.index).split('\n').length;

    // The literal case: href="/thing" or href={`/blog/${id}`}.
    if (INTERNAL_HREF.test(attrs) && !FILE_HREF.test(attrs)) {
      problems.push(
        `${rel}:${line}: internal <a> carries data-umami-event, which cancels the ` +
        `view transition. Use data-track= instead (see scripts/check-tracking.mjs).`
      );
      continue;
    }

    // The dynamic case, which is where this rule was actually broken. An href
    // built from an expression cannot be classified by reading it, and
    // `data-umami-event={`case-study-${id}`}` on an internal route is exactly
    // the bug: it looks fine and silently downgrades every case-study click.
    // So an expression-valued event name has to SHOW that its link leaves the
    // site - either by branching on `external`, or by carrying rel="noopener",
    // which internal links here never do. Anything else is unclassifiable and
    // must be made explicit rather than assumed safe.
    if (/data-umami-event=\{/.test(attrs) &&
        !/\bexternal\b/.test(attrs) &&
        !/rel=[^>]*noopener/.test(attrs)) {
      problems.push(
        `${rel}:${line}: <a> sets data-umami-event from an expression with nothing ` +
        `showing the link is outbound. If it is internal use data-track=; if it is ` +
        `outbound, make that visible (rel="noopener", or branch on l.external).`
      );
    }
  }
}

const known = (e) =>
  e.endsWith('*')
    ? DECLARED_PREFIXES.includes(e.slice(0, -1))
    : DECLARED.has(e) ||
      DECLARED_PREFIXES.some((p) => e.startsWith(p) && e.length > p.length);

const undeclared = [...seen].filter((e) => !known(e)).sort();
const unused = [...DECLARED].filter((e) => !seen.has(e)).sort();
const unusedFamilies = DECLARED_PREFIXES.filter((p) => !seen.has(`${p}*`)).sort();

if (undeclared.length) {
  problems.push(
    `event(s) in the source but not declared: ${undeclared.join(', ')}.\n` +
    `    Add them to DECLARED in scripts/check-tracking.mjs AND describe them in ` +
    `src/pages/privacy.astro, with a log entry and a version bump.`
  );
}
if (unusedFamilies.length) {
  problems.push(
    `event famil(ies) declared but not built anywhere: ` +
    `${unusedFamilies.map((p) => `${p}*`).join(', ')}.`
  );
}
if (unused.length) {
  problems.push(
    `event(s) declared but no longer sent: ${unused.join(', ')}.\n` +
    `    Remove them from DECLARED and from the privacy page's description.`
  );
}

if (problems.length) {
  console.error('check-tracking: FAILED\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    `\n  ${seen.size} event name(s) found across ${files.length} file(s).`
  );
  process.exit(1);
}

console.log(
  `check-tracking: ok - ${seen.size} event(s), all declared and described; ` +
  `no internal link carries data-umami-event.`
);
