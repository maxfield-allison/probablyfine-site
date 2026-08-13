// Copy the self-hosted webfonts out of node_modules into public/fonts/.
//
// Why not just `import '@fontsource-variable/inter'`? That pulls in @font-face
// rules for every subset (cyrillic, greek, vietnamese, ...) and emits all of
// their .woff2 files into dist. Browsers only ever download latin for this
// site's content, so the rest is dead weight in the container image. Copying
// the latin files by hand gives us two files, stable URLs we can <link
// rel="preload">, and full control over font-display.
//
// Output is a build artifact (public/fonts/ is gitignored), so no binaries are
// committed. Runs automatically before `dev` and `build`; also `pnpm fonts`.
//
// CACHING: nginx.conf serves *.woff2 as `immutable, max-age=31536000`, and
// these output names are NOT content-hashed. That is fine because the files
// only change when the dependency is bumped deliberately. If you ever swap a
// face or change a subset, CHANGE THE OUTPUT FILENAME too (and the matching
// @font-face src + <link rel="preload"> in the layout), or clients will hold
// the old file for up to a year without revalidating.
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const OUT_DIR = 'public/fonts';

// pkg = the fontsource package; file = the latin variable-weight roman face.
// Roman only: the design uses italic only on annotation text, and a synthetic
// oblique is a better trade than doubling the font payload. Revisit if italic
// emphasis in prose looks wrong.
const FONTS = [
  { pkg: '@fontsource-variable/inter', file: 'inter-latin-wght-normal.woff2', out: 'inter-latin.woff2' },
  { pkg: '@fontsource-variable/jetbrains-mono', file: 'jetbrains-mono-latin-wght-normal.woff2', out: 'jetbrains-mono-latin.woff2' },
];

await mkdir(OUT_DIR, { recursive: true });

let total = 0;
for (const font of FONTS) {
  // Resolve through package.json so this doesn't hard-code a node_modules
  // layout (pnpm nests differently from npm).
  const pkgJson = require.resolve(`${font.pkg}/package.json`);
  const src = new URL(`./files/${font.file}`, `file://${pkgJson}`).pathname;
  const dest = `${OUT_DIR}/${font.out}`;
  await copyFile(src, dest);
  const { size } = await stat(dest);
  total += size;
  console.log(`fonts: ${font.out} (${(size / 1024).toFixed(1)} KB)`);
}
console.log(`fonts: ${FONTS.length} files, ${(total / 1024).toFixed(1)} KB total`);
