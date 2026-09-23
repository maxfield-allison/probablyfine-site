// Keep the delivery layer the two sites share in step.
//
// probablyfine-site and personal-site share their plumbing (container, nginx,
// security headers, failover Worker, OG and read-tracking scripts) and
// deliberately do not share their design. The plumbing used to be copied by
// hand, and the copies drifted. manifest.json lists every shared file and how
// each site gets it; probablyfine-site is the source of truth.
//
//   From probablyfine-site:
//     node scripts/shared/sync-shared.mjs ../personal-site          write
//     node scripts/shared/sync-shared.mjs ../personal-site --check  exit 1 on drift
//     node scripts/shared/sync-shared.mjs . --check                 this repo's own templated files
//
//   From personal-site, against a probablyfine-site checkout:
//     node scripts/shared/sync-shared.mjs --check --source ../probablyfine-site
//
// The target defaults to the checkout this script sits in, and so does the
// source. Whatever copy of this script runs, the manifest, templates and
// generator are always read from the source checkout, so a stale copy in the
// target cannot vouch for itself.
//
// Modes (see manifest.json):
//   verbatim   the source repo's file, byte for byte
//   template   scripts/shared/templates/<path> with %{name} replaced by the
//              target site's values from manifest.json
//   generated  rendered by scripts/shared/headers.mjs from the target's own
//              security-policy.mjs, using the source's nginx template
//   hold       listed so nobody forgets it, not synced; `reason` says why
//
// Node standard library only.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OWN_ROOT = resolve(HERE, '..', '..');
const SHARED_DIR = 'scripts/shared';

function parseArgs(argv) {
  const opts = { check: false, source: OWN_ROOT, target: OWN_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '--source') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error('--source needs a path');
      opts.source = resolve(value);
    } else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
    else opts.target = resolve(arg);
  }
  return opts;
}

const readText = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
};

async function loadSource(root) {
  const manifest = JSON.parse(readFileSync(join(root, SHARED_DIR, 'manifest.json'), 'utf8'));
  const headers = await import(pathToFileURL(join(root, SHARED_DIR, 'headers.mjs')).href);
  const nginxTemplate = readFileSync(join(root, SHARED_DIR, 'nginx.conf.template'), 'utf8');
  return { root, manifest, headers, nginxTemplate };
}

function siteOf(source, target) {
  const { name } = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
  const values = source.manifest.sites[name];
  if (!values) throw new Error(`${target}: package "${name}" is not a site in manifest.json`);
  return { name, values };
}

// What each shared file should contain in the target. `null` for held files.
async function expectedFiles(source, target, site) {
  const generated = await source.headers.generate(target, source.nginxTemplate);
  const out = new Map();

  for (const entry of source.manifest.files) {
    const { path, mode } = entry;
    if (mode === 'hold') {
      out.set(path, null);
    } else if (mode === 'verbatim') {
      const text = readText(join(source.root, path));
      if (text === null) throw new Error(`manifest lists ${path}, which the source does not have`);
      out.set(path, text);
    } else if (mode === 'template') {
      const template = readText(join(source.root, SHARED_DIR, 'templates', path));
      if (template === null) throw new Error(`no template for ${path}`);
      out.set(path, source.headers.render(template, site.values, `templates/${path}`));
    } else if (mode === 'generated') {
      if (!generated.has(path)) throw new Error(`${path} is not produced by headers.mjs`);
      out.set(path, generated.get(path));
    } else {
      throw new Error(`${path}: unknown mode "${mode}"`);
    }
  }
  return out;
}

const firstDifference = (a, b) => {
  const x = a.split('\n');
  const y = b.split('\n');
  const n = x.findIndex((line, i) => line !== y[i]);
  return n === -1 ? y.length : n + 1;
};

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const source = await loadSource(opts.source);
  const site = siteOf(source, opts.target);
  const expected = await expectedFiles(source, opts.target, site);
  const where = relative(process.cwd(), opts.target) || '.';

  const drift = [];
  const held = [];
  for (const [path, content] of expected) {
    if (content === null) {
      held.push(path);
      continue;
    }
    const current = readText(join(opts.target, path));
    if (current === content) continue;
    if (opts.check) {
      drift.push(current === null ? `${path} (missing)` : `${path} (first difference at line ${firstDifference(current, content)})`);
      continue;
    }
    mkdirSync(dirname(join(opts.target, path)), { recursive: true });
    writeFileSync(join(opts.target, path), content);
    console.log(`shared: wrote ${path}`);
  }

  const synced = expected.size - held.length;
  if (held.length) console.log(`shared: held, not synced: ${held.join(', ')}`);
  if (drift.length) {
    console.error(`shared: ${where} (${site.name}) has drifted from ${source.manifest.source}:`);
    for (const d of drift) console.error(`  - ${d}`);
    console.error(`Change the shared source in ${source.manifest.source} (or the site's security-policy.mjs), then run sync-shared.mjs without --check.`);
    process.exit(1);
  }
  console.log(`shared: ${where} (${site.name}) ${opts.check ? 'matches' : 'is in step with'} ${source.manifest.source}, ${synced} files`);
}

main().catch((err) => {
  console.error(`shared: ${err.message}`);
  process.exit(1);
});
