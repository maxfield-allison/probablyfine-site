// Pull a photo out of the Immich library and drop it into src/content/posts/img/
// ready to reference from a post.
//
//   pnpm photo:albums                          list albums, with asset counts
//   pnpm photo:album "Blog"                    list the assets in an album
//   pnpm photo:find "server rack"              smart-search the whole library
//   pnpm photo <asset-id> 2026-basement-rack   fetch, strip, resize, write
//
// Images are committed to the repo rather than hotlinked from Immich, so the
// published site never depends on the homelab being up and no share URL leaks
// infrastructure. See homelab-docs/projects/photo-library/README.md (D5).
//
// Every file written here has ALL metadata stripped — that includes the GPS
// coordinates Google Photos and phone cameras attach to nearly everything. What
// the script cannot check is what is visible *in* the frame: house numbers,
// plates, screens showing internal IPs, faces of people who did not agree to be
// on a public site. That review is still yours.
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const IMG_DIR = 'src/content/posts/img';

// Use the public hostname even from inside the network. Traefik's split-horizon
// routing sends requests from LAN client IPs straight to Immich, bypassing the
// Authentik forward-auth that an API key would not satisfy, and it carries a real
// Let's Encrypt certificate. The photos.local.* host would work too, but it is
// served by the internal PKI, which Node does not trust without NODE_EXTRA_CA_CERTS.
// Run this from outside the network and Authentik will intercept, as intended.
const DEFAULT_URL = 'https://photos.probablyfine.dev';

// Long edge, matching what is already in src/content/posts/img (all 1600px).
// Astro resizes again at build time; this just keeps multi-megabyte originals
// out of git history.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 82;

// Both Immich keys live in one file in the homelab secrets directory, which is
// never committed: keys.blog is the read-only one this script uses, keys.import
// is the full-permission one immich-go uses for takeout imports. Env vars win so
// this still works from CI or a checkout on another machine.
const KEYS_FILE = join(homedir(), 'homelab', 'secrets', 'immich-keys.json');

let configPromise;
function config() {
  configPromise ??= readFile(KEYS_FILE, 'utf8')
    .then(JSON.parse)
    .catch(() => ({}));
  return configPromise;
}

async function apiKey() {
  if (process.env.IMMICH_API_KEY) return process.env.IMMICH_API_KEY;
  const key = (await config()).keys?.blog;
  if (key) return key;
  throw new Error(
    `No API key. Set IMMICH_API_KEY, or fill in "keys.blog" in ${KEYS_FILE}.\n` +
      `Create the key at ${DEFAULT_URL}/user-settings -> API Keys, with the\n` +
      `permissions asset.read, asset.download and album.read.`
  );
}

async function api(path, { method = 'GET', body } = {}) {
  const base = process.env.IMMICH_URL || (await config()).server || DEFAULT_URL;
  const res = await fetch(new URL(path, base), {
    method,
    headers: {
      'x-api-key': await apiKey(),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    // A scoped key that is missing one permission fails exactly like a bad key,
    // so say which permissions this script expects rather than just the status.
    const hint =
      res.status === 401 || res.status === 403
        ? `\n  The blog key needs: asset.read, asset.download, album.read.` +
          `\n  Check it at ${base}/user-settings -> API Keys.`
        : '';
    throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}${hint}`);
  }
  return res;
}

// Immich dates come back as ISO strings; the img naming convention wants the year.
const yearOf = (asset) =>
  (asset.exifInfo?.dateTimeOriginal || asset.fileCreatedAt || '').slice(0, 4);

function describe(asset) {
  const date = (asset.exifInfo?.dateTimeOriginal || asset.fileCreatedAt || '').slice(0, 10);
  const dims = asset.exifInfo?.exifImageWidth
    ? `${asset.exifInfo.exifImageWidth}x${asset.exifInfo.exifImageHeight}`
    : '?';
  return `${asset.id}  ${date}  ${dims.padEnd(11)} ${asset.originalFileName}`;
}

async function listAlbums() {
  const albums = await (await api('/api/albums')).json();
  if (!albums.length) return console.log('No albums yet.');
  for (const a of albums) {
    console.log(`${String(a.assetCount).padStart(5)}  ${a.albumName}`);
  }
}

async function listAlbum(name) {
  const albums = await (await api('/api/albums')).json();
  const album = albums.find((a) => a.albumName.toLowerCase() === name.toLowerCase());
  if (!album) {
    throw new Error(
      `No album named "${name}". Run \`pnpm photo:albums\` to see what exists.`
    );
  }
  const full = await (await api(`/api/albums/${album.id}`)).json();
  for (const asset of full.assets ?? []) console.log(describe(asset));
}

// Smart (CLIP) search — the same thing the Immich search bar does, so plain
// language works: "server rack", "cat on a computer".
async function find(query) {
  const res = await api('/api/search/smart', { method: 'POST', body: { query, size: 25 } });
  const items = (await res.json()).assets?.items ?? [];
  if (!items.length) return console.log('No matches.');
  for (const asset of items) console.log(describe(asset));
}

async function fetchPhoto(id, name) {
  const asset = await (await api(`/api/assets/${id}`)).json();

  // Nudge, not a rule: the convention is YYYY-short-slug, and the year should be
  // the year the photo was taken.
  const year = yearOf(asset);
  if (year && !name.startsWith(year)) {
    console.warn(`note: photo was taken in ${year}, but the name starts "${name.split('-')[0]}"`);
  }

  const hadGps = asset.exifInfo?.latitude != null || asset.exifInfo?.longitude != null;

  const original = Buffer.from(await (await api(`/api/assets/${id}/original`)).arrayBuffer());

  await mkdir(IMG_DIR, { recursive: true });
  const out = join(IMG_DIR, `${name}.jpg`);

  // .rotate() with no argument applies the EXIF orientation tag before the
  // metadata is discarded — without it, portrait phone shots come out sideways.
  // sharp drops all metadata unless withMetadata() is called, which is exactly
  // what we want here.
  const info = await sharp(original)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  await writeFile(out, info.data);

  const kb = Math.round(info.data.length / 1024);
  console.log(`\nwrote ${out}  ${info.info.width}x${info.info.height}  ${kb}KB`);
  console.log(`  from ${asset.originalFileName} (${asset.exifInfo?.exifImageWidth ?? '?'}px original)`);
  console.log(`  metadata stripped${hadGps ? ' — including GPS coordinates, which were present' : ''}`);
  console.log(`\nReference it from the post, and write real alt text:\n`);
  console.log(`![](./img/${name}.jpg)`);
  console.log(`   ^ alt text goes here: describe what is in the frame, it is read aloud.\n`);
}

const [cmd, ...rest] = process.argv.slice(2);

try {
  if (cmd === '--albums') {
    await listAlbums();
  } else if (cmd === '--album') {
    if (!rest[0]) throw new Error('usage: --album "Album Name"');
    await listAlbum(rest[0]);
  } else if (cmd === '--find') {
    if (!rest[0]) throw new Error('usage: --find "what you are looking for"');
    await find(rest.join(' '));
  } else if (cmd && rest[0]) {
    await fetchPhoto(cmd, rest[0].replace(/\.jpg$/, ''));
  } else {
    console.log(
      [
        'usage:',
        '  pnpm photo:albums                          list albums',
        '  pnpm photo:album "Blog"                    list assets in an album',
        '  pnpm photo:find "server rack"              search the library',
        '  pnpm photo <asset-id> 2026-basement-rack   write it to src/content/posts/img/',
        '',
        'The asset id is in the Immich URL when a photo is open: /photos/<asset-id>',
      ].join('\n')
    );
    process.exit(1);
  }
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
