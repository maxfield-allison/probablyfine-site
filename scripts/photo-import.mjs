// Import photographs that arrived as files rather than out of Immich — a curated
// batch, an export, someone else's camera — through the same strip-and-resize
// pipeline the Immich puller uses.
//
//   pnpm photo:import --out src/assets/pets --manifest ~/somewhere/pets.tsv
//   pnpm photo:import --out src/assets/pets photo.jpg 2026-tamale
//
// The manifest is tab-separated, one photo per line, `source path` then `output
// name`, with # for comments. Keeping the mapping in a file rather than a shell
// loop means the provenance of a batch is written down somewhere: which original
// became which committed image.
//
// Every file written here has ALL metadata stripped, GPS included. See
// scripts/lib/photo.mjs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { processPhoto, hadGps, MAX_EDGE } from './lib/photo.mjs';

function parseArgs(argv) {
  const opts = { out: null, manifest: null, maxEdge: MAX_EDGE, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = argv[++i];
    else if (a === '--manifest') opts.manifest = argv[++i];
    else if (a === '--max-edge') opts.maxEdge = Number(argv[++i]);
    else opts.rest.push(a);
  }
  return opts;
}

async function readManifest(path) {
  const text = await readFile(path, 'utf8');
  const jobs = [];
  text.split('\n').forEach((line, n) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [src, name] = trimmed.split('\t').map((s) => s?.trim());
    if (!src || !name) {
      throw new Error(`${path}:${n + 1}: expected "source<TAB>name", got: ${trimmed}`);
    }
    jobs.push({ src, name: name.replace(/\.jpg$/, '') });
  });
  return jobs;
}

async function importOne({ src, name }, { out, maxEdge }) {
  const original = await readFile(src);
  const gps = await hadGps(original);
  const { data, info } = await processPhoto(original, { maxEdge });
  const dest = join(out, `${name}.jpg`);
  await writeFile(dest, data);
  return { dest, gps, bytes: data.length, width: info.width, height: info.height, from: basename(src) };
}

const opts = parseArgs(process.argv.slice(2));

try {
  if (!opts.out) throw new Error('--out <dir> is required');

  const jobs = opts.manifest
    ? await readManifest(opts.manifest)
    : opts.rest.length === 2
      ? [{ src: opts.rest[0], name: opts.rest[1].replace(/\.jpg$/, '') }]
      : null;

  if (!jobs) {
    throw new Error(
      'usage: --out <dir> --manifest <file.tsv>\n' +
        '   or: --out <dir> <source.jpg> <output-name>'
    );
  }

  await mkdir(opts.out, { recursive: true });

  let total = 0;
  let stripped = 0;
  for (const job of jobs) {
    const r = await importOne(job, opts);
    total += r.bytes;
    if (r.gps) stripped++;
    console.log(
      `${r.dest.padEnd(44)} ${String(r.width) + 'x' + r.height} ` +
        `${String(Math.round(r.bytes / 1024)).padStart(5)}KB  <- ${r.from}`
    );
  }

  console.log(
    `\n${jobs.length} photos, ${Math.round(total / 1024)}KB total, all metadata stripped` +
      (stripped ? ` — ${stripped} carried GPS coordinates` : '')
  );
  console.log('Now look at the frames: house numbers, plates, screens, faces.');
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
