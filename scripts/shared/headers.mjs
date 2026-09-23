// Generate nginx.conf and public/_headers from one security policy.
//
// The site is served from two places: nginx.conf covers the Kubernetes origin
// and public/_headers covers the Cloudflare Pages mirror that takes over when
// the origin is down. Pages does not read nginx.conf, so the headers have to
// be written into both. When both were written by hand they could disagree,
// and the disagreement only shows on the day the mirror is answering.
//
// So neither is written by hand. security-policy.mjs at the site root defines
// the headers once; this renders both files from it.
//
//   node scripts/shared/headers.mjs                  write both files for this site
//   node scripts/shared/headers.mjs --check          exit 1 if either file is stale
//   node scripts/shared/headers.mjs ../personal-site --check
//
// This replaces scripts/check-headers.mjs, which compared the two hand-written
// files after the fact. Like that script it takes a site root, so one checkout
// can check the other. This file is shared: probablyfine-site owns it and
// scripts/shared/sync-shared.mjs copies it to personal-site.
//
// Node standard library only.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const POLICY_FILE = 'security-policy.mjs';
export const NGINX_TEMPLATE = join(HERE, 'nginx.conf.template');

// %{name} placeholders. Deliberately not {{name}}: GitHub Actions templates
// are full of ${{ ... }}, and those have to pass through untouched.
export function render(template, values, label = 'template') {
  return template.replace(/%\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`${label}: no value for %{${key}}`);
    return values[key];
  });
}

function serialise(name, value) {
  if (typeof value === 'string') return value;
  if (name.toLowerCase() !== 'content-security-policy' || typeof value !== 'object') {
    throw new Error(`${name}: expected a string`);
  }
  return Object.entries(value)
    .map(([directive, sources]) => [directive, ...sources].join(' '))
    .join('; ');
}

function validate(name, value) {
  if (!/^[A-Za-z0-9-]+$/.test(name)) throw new Error(`bad header name: ${name}`);
  if (/["\r\n]/.test(value)) throw new Error(`${name}: value may not contain quotes or newlines`);
  // Cloudflare Pages rejects _headers lines over 2,000 characters.
  if (name.length + value.length + 4 > 2000) throw new Error(`${name}: value too long for _headers`);
  return value;
}

// Serialise a { name: value } map, dropping nulls.
function resolveHeaders(headers) {
  const out = new Map();
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) continue;
    out.set(name, validate(name, serialise(name, value)));
  }
  return out;
}

// The complete header set a scope serves: the base set with the scope's
// additions and replacements applied. nginx needs this, because a location
// with any add_header inherits none.
function effective(policy, scope) {
  const merged = { ...policy.headers };
  for (const [name, value] of Object.entries(scope.headers ?? {})) {
    const existing = Object.keys(merged).find((k) => k.toLowerCase() === name.toLowerCase());
    if (existing && existing !== name) delete merged[existing];
    merged[name] = value;
  }
  return resolveHeaders(merged);
}

export async function loadPolicy(root) {
  const url = pathToFileURL(join(root, POLICY_FILE)).href;
  const policy = (await import(url)).default;
  if (!policy?.headers) throw new Error(`${POLICY_FILE}: no default export with headers`);
  policy.scopes ??= [];
  for (const scope of policy.scopes) {
    if (!/^\/[^\s*{};]*$/.test(scope.path ?? '')) throw new Error(`scope path not usable: ${scope.path}`);
    if (!scope.tryFiles) throw new Error(`scope ${scope.path}: tryFiles is required`);
  }
  return policy;
}

const nginxLines = (headers, indent) =>
  [...headers].map(([n, v]) => `${indent}add_header ${n} "${v}" always;`);

const comment = (lines, indent, prefix = '#') =>
  (lines ?? []).map((l) => (l ? `${indent}${prefix} ${l}` : `${indent}${prefix}`));

export function renderNginx(policy, template) {
  const base = resolveHeaders(policy.headers);
  const I8 = ' '.repeat(8);
  const I12 = ' '.repeat(12);

  const serverHeaders = [...nginxLines(base, I8), `${I8}add_header Cache-Control $cache_control;`];

  const scoped = [];
  for (const scope of policy.scopes) {
    scoped.push(
      '',
      ...comment(scope.note, I8),
      `${I8}# Restates every inherited header (see the add_header note above).`,
      `${I8}location ${scope.path} {`,
      ...nginxLines(effective(policy, scope), I12),
      `${I12}add_header Cache-Control $cache_control;`,
      `${I12}try_files ${scope.tryFiles};`,
      `${I8}}`
    );
  }

  const notFound = [...nginxLines(base, I12), `${I12}add_header Cache-Control "no-store" always;`];

  return render(
    template,
    {
      serverHeaders: serverHeaders.join('\n'),
      // A trailing blank line keeps the next location visually separate.
      scopedLocations: scoped.length ? [...scoped, ''].join('\n') : '',
      notFoundHeaders: notFound.join('\n'),
    },
    'nginx.conf.template'
  );
}

// Pages applies every rule whose pattern matches a request, and a header set
// by two rules is joined with a comma. Two CSP values joined that way are two
// policies, and the browser enforces both, so a scope that means to replace
// the site CSP would only ever narrow it. So a scoped rule carries only what
// differs from /*, and detaches ("! Name") each inherited header it replaces
// or removes before setting its own.
export function renderPagesHeaders(policy) {
  const base = resolveHeaders(policy.headers);
  const lower = (m) => new Map([...m].map(([k, v]) => [k.toLowerCase(), [k, v]]));

  const out = [
    '# GENERATED FILE. Do not edit by hand.',
    '#',
    '# Cloudflare Pages headers for the failover mirror, rendered from',
    '# security-policy.mjs by scripts/shared/headers.mjs. Pages does not run',
    '# nginx.conf, so without this file the mirror would answer with no CSP, no',
    '# HSTS and no framing protection exactly when the origin is already down.',
    '# Change the policy and run `pnpm headers`; the build fails when this file',
    '# and the policy disagree.',
    '#',
    '# Pages applies every matching rule, so a scoped rule lists only what',
    '# differs from /* and detaches ("! Name") any header it replaces.',
    '',
    '/*',
    ...[...base].map(([n, v]) => `  ${n}: ${v}`),
  ];

  const baseByLower = lower(base);
  for (const scope of policy.scopes) {
    const eff = lower(effective(policy, scope));
    const lines = [];
    for (const [key, [name]] of baseByLower) {
      if (!eff.has(key)) lines.push(`  ! ${name}`);
    }
    for (const [key, [name, value]] of eff) {
      const inherited = baseByLower.get(key);
      if (inherited && inherited[1] === value) continue;
      if (inherited) lines.push(`  ! ${inherited[0]}`);
      lines.push(`  ${name}: ${value}`);
    }
    if (!lines.length) continue;
    out.push('', ...comment(scope.note, ''), `${scope.path}*`, ...lines);
  }

  return out.join('\n') + '\n';
}

// Everything this module produces for a site, keyed by path relative to the
// site root. `template` lets sync-shared.mjs render another checkout with the
// source repository's template rather than the target's copy of it.
export async function generate(root, template = readFileSync(NGINX_TEMPLATE, 'utf8')) {
  const policy = await loadPolicy(root);
  return new Map([
    ['nginx.conf', renderNginx(policy, template)],
    ['public/_headers', renderPagesHeaders(policy)],
  ]);
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const rootArg = args.find((a) => !a.startsWith('--'));
  const root = rootArg ? resolve(rootArg) : resolve(HERE, '..', '..');

  const files = await generate(root);
  const stale = [];
  for (const [rel, content] of files) {
    const path = join(root, rel);
    let current = null;
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current === content) continue;
    if (check) stale.push(rel);
    else {
      writeFileSync(path, content);
      console.log(`headers: wrote ${rel}`);
    }
  }

  if (stale.length) {
    console.error(`headers: ${stale.join(' and ')} ${stale.length > 1 ? 'do' : 'does'} not match ${POLICY_FILE}.`);
    console.error('Edit the policy, not the generated files, then run `pnpm headers`.');
    process.exit(1);
  }
  if (check) console.log(`headers: nginx.conf and public/_headers match ${POLICY_FILE}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`headers: ${err.message}`);
    process.exit(1);
  });
}
