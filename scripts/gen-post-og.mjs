// Generate a per-post OG social card for every blog post.
//   src/content/posts/<slug>.md (title) -> public/og/<slug>.png (1200x630)
// Runs automatically as a prebuild step; also `pnpm og:posts`.
//
// Reuses the site brand (green accent) and the same template as scripts/og.svg.
// Output is a build artifact (public/og/ is gitignored), so new posts get a
// card automatically on the next build with no committed binaries.
import sharp from 'sharp';
import { readdir, readFile, mkdir } from 'node:fs/promises';

const POSTS_DIR = 'src/content/posts';
const OUT_DIR = 'public/og';

// Minimal frontmatter reader: pull the `title:` value from the top block.
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

// Word-wrap a title to at most `maxChars` per line, up to `maxLines` lines.
function wrap(text, maxChars = 26, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\.*$/, '') + '...';
  }
  return lines;
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

function svg(title) {
  const lines = wrap(title);
  const size = lines.length >= 3 ? 62 : 72;
  const lineHeight = size * 1.15;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((l, i) => `<text x="80" y="${startY + i * lineHeight}" font-family="Inter, 'DejaVu Sans', system-ui, sans-serif" font-size="${size}" font-weight="600" fill="#e6edf3">${escapeXml(l)}</text>`)
    .join('\n  ');
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0e12"/>
      <stop offset="1" stop-color="#11161c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="#3fb950"/>
  <text x="80" y="120" font-family="'DejaVu Sans Mono', monospace" font-size="26" fill="#8b98a5">probably<tspan fill="#3fb950">fine</tspan>.dev</text>
  ${tspans}
  <text x="80" y="560" font-family="'DejaVu Sans Mono', monospace" font-size="22" fill="#3fb950">$ cat /var/log/probablyfine</text>
</svg>`;
}

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
await mkdir(OUT_DIR, { recursive: true });
for (const f of files) {
  const md = await readFile(`${POSTS_DIR}/${f}`, 'utf8');
  const { title } = frontmatter(md);
  if (!title) continue;
  const slug = f.replace(/\.(md|mdx)$/, '');
  await sharp(Buffer.from(svg(title))).png().toFile(`${OUT_DIR}/${slug}.png`);
  console.log('og:', slug);
}
