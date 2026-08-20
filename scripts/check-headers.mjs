// Fail the build when nginx.conf and public/_headers disagree about security
// headers.
//
// The site is served from two places. nginx.conf covers the Kubernetes origin;
// public/_headers covers the Cloudflare Pages mirror that takes over when the
// origin is down. Pages does not read nginx.conf, so the policy genuinely does
// live in two files.
//
// Both files already carried a comment saying "keep these in step". A comment
// is a hope. The failure mode it is hoping to prevent is the nastiest kind:
// change one file and not the other, and everything works right up until
// failover, which happens on the day the cluster is already broken and nobody
// is looking at the comment widget.
//
// So this compares them mechanically and exits non-zero on drift. Runs from
// prebuild.
//
// Cache-Control is excluded: nginx computes it per-URI from a map, Pages does
// not, and they are not meant to match.

// Takes an optional site root, so the same script can check personal-site,
// which has the identical origin/mirror split. See probablyfine-site#3 — this
// is one of the files that should end up in a shared layer rather than being
// copied.
//
//   node scripts/check-headers.mjs ../personal-site

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = process.argv[2]
  ? resolve(process.argv[2])
  : join(dirname(fileURLToPath(import.meta.url)), '..');

const IGNORED = new Set(['cache-control', 'content-type']);

// Scopes are derived, not listed, so this works unchanged on a site that has no
// scoped policies at all. An nginx location `/foo/` corresponds to the
// `/foo/*` section in _headers; the server block corresponds to `/*`.
const toPagesPattern = (loc) => (loc === null ? '/*' : `${loc.replace(/\/$/, '')}/*`);

// --- nginx.conf ------------------------------------------------------------
//
// Walks the file tracking brace depth so each add_header is attributed to the
// location block that encloses it, or to the server block if none does. This
// matters because nginx's add_header is not additive: a location block that
// declares any add_header drops everything inherited, so each scope is a
// complete, independent set.
function parseNginx(text) {
  const scopes = new Map(); // location prefix (or null) -> Map(name -> value)
  const stack = []; // enclosing location prefixes, innermost last

  const lines = text.split('\n');
  for (const line of lines) {
    const loc = line.match(/^\s*location\s+(?:=\s+)?(\S+)\s*\{/);
    if (loc) {
      stack.push(loc[1]);
      continue;
    }

    const header = line.match(/^\s*add_header\s+(\S+)\s+"([^"]*)"/);
    if (header) {
      const scope = stack.length ? stack[stack.length - 1] : null;
      if (!scopes.has(scope)) scopes.set(scope, new Map());
      scopes.get(scope).set(header[1].toLowerCase(), header[2].trim());
    }

    // Depth bookkeeping. Count braces after stripping quoted strings so a
    // brace inside a header value cannot unbalance the walk.
    const bare = line.replace(/"[^"]*"/g, '');
    const opens = (bare.match(/\{/g) || []).length - (loc ? 1 : 0);
    const closes = (bare.match(/\}/g) || []).length;
    for (let i = 0; i < closes - opens && stack.length; i++) stack.pop();
  }

  return scopes;
}

// --- public/_headers -------------------------------------------------------
function parseHeadersFile(text) {
  const scopes = new Map(); // path pattern -> Map(name -> value)
  let current = null;

  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    if (!/^\s/.test(raw)) {
      current = raw.trim();
      scopes.set(current, new Map());
      continue;
    }

    if (!current) continue;
    const idx = raw.indexOf(':');
    if (idx === -1) continue;
    scopes
      .get(current)
      .set(raw.slice(0, idx).trim().toLowerCase(), raw.slice(idx + 1).trim());
  }

  return scopes;
}

// A CSP is a set of directives, not an ordered string. Compare it as a set so
// reordering directives is not reported as drift.
function normalise(name, value) {
  if (name !== 'content-security-policy') return value.replace(/\s+/g, ' ').trim();
  return value
    .split(';')
    .map((d) => d.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .sort()
    .join('; ');
}

const nginx = parseNginx(readFileSync(join(root, 'nginx.conf'), 'utf8'));
const pages = parseHeadersFile(readFileSync(join(root, 'public/_headers'), 'utf8'));

// Drop scopes whose only headers are ignored ones. nginx's @notfound block
// declares Cache-Control and nothing else; it is not a policy surface.
const meaningful = (headers) => [...headers.keys()].some((n) => !IGNORED.has(n));

const scopes = new Map(); // pages pattern -> nginx location (or null)
for (const [loc, headers] of nginx) {
  if (meaningful(headers)) scopes.set(toPagesPattern(loc), loc);
}
for (const [pattern, headers] of pages) {
  if (meaningful(headers) && !scopes.has(pattern)) scopes.set(pattern, undefined);
}

const problems = [];

for (const [pagesScope, nginxScope] of [...scopes].sort()) {
  const a = nginxScope === undefined ? undefined : nginx.get(nginxScope);
  const b = pages.get(pagesScope);
  const label = `${nginxScope ?? 'server block'} vs ${pagesScope}`;

  if (!a) {
    problems.push(
      `public/_headers has a ${pagesScope} policy with no matching nginx.conf scope`
    );
    continue;
  }
  if (!b) {
    problems.push(
      `nginx.conf has a ${nginxScope ?? 'server block'} policy with no matching ${pagesScope} section in public/_headers`
    );
    continue;
  }

  const names = new Set([...a.keys(), ...b.keys()].filter((n) => !IGNORED.has(n)));
  for (const name of [...names].sort()) {
    if (!a.has(name)) {
      problems.push(`${label}: ${name} is in public/_headers but not nginx.conf`);
      continue;
    }
    if (!b.has(name)) {
      problems.push(`${label}: ${name} is in nginx.conf but not public/_headers`);
      continue;
    }
    const av = normalise(name, a.get(name));
    const bv = normalise(name, b.get(name));
    if (av !== bv) {
      problems.push(
        `${label}: ${name} differs\n    nginx.conf     ${av}\n    public/_headers ${bv}`
      );
    }
  }
}

if (problems.length) {
  console.error('Security headers drifted between the origin and the failover mirror:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nBoth files have to carry the same policy. The mirror does not read nginx.conf.'
  );
  process.exit(1);
}

console.log('headers: nginx.conf and public/_headers agree');
