// Generate the OG social card for /pets.
//   src/assets/pets/*.jpg -> public/og/pets.jpg (1200x630)
// Runs automatically as a prebuild step; also `pnpm og:pets`.
//
// Three panels, one per limb of the joke: all the dogs, three cats, three
// horses. No text on this card, deliberately. Every surface that renders a link
// preview already prints og:title and og:description beside the image, so words
// here would only be repeated, and a photograph is what this page is for.
//
// Output is a build artifact (public/og/ is gitignored), like the per-post
// cards, so it regenerates from the committed photos rather than being a binary
// in git that can drift away from them.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'src/assets/pets';
const OUT_DIR = 'public/og';

const W = 1200;
const H = 630;
const ACCENT_H = 8; // the green rule under the site header, echoed
const GAP = 6;
const PANEL_W = Math.round((W - GAP * 2) / 3);
const PANEL_H = H - ACCENT_H;

// --color-line and --color-accent from src/styles/global.css.
const LINE = '#212a33';
const ACCENT = '#3fb950';

// The crop anchor is per panel because the subjects sit differently in frame:
// the dogs are stacked against the top of a gate above a lot of empty decking,
// so an attention crop keeps the boards. The other two are centred well enough
// that libvips can pick for itself.
const panels = [
  { name: '2025-all-the-dogs', position: 'top' },
  { name: '2022-roli-stoli-madeline', position: 'attention' },
  { name: '2026-three-horses', position: 'attention' },
];

const composites = [];
for (const [i, { name, position }] of panels.entries()) {
  const buf = await sharp(join(SRC, `${name}.jpg`))
    .resize(PANEL_W, PANEL_H, { fit: 'cover', position })
    .toBuffer();
  composites.push({ input: buf, left: i * (PANEL_W + GAP), top: 0 });
}

composites.push({
  input: {
    create: { width: W, height: ACCENT_H, channels: 3, background: ACCENT },
  },
  left: 0,
  top: PANEL_H,
});

await mkdir(OUT_DIR, { recursive: true });
const out = join(OUT_DIR, 'pets.jpg');
await sharp({ create: { width: W, height: H, channels: 3, background: LINE } })
  .composite(composites)
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(out);

console.log(`wrote ${out}  ${W}x${H}  (${panels.map((p) => p.name).join(', ')})`);
