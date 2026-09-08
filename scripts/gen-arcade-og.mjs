// A share card made from the same real screenshots as the game collection.
// Generated alongside the post cards; also suitable for a Viva image upload.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const games = [
  ['hocus-pocus', 'Hocus Pocus', 'DOS'],
  ['swoop', 'Swoop', 'MAC'],
  ['space-cadet', 'Space Cadet', 'WINDOWS'],
];
const panels = await Promise.all(games.map(async ([slug, title, platform], index) => {
  const png = await sharp(`public/images/arcade/${slug}.webp`).png().toBuffer();
  const x = 48 + index * 372;
  return `<rect x="${x - 1}" y="225" width="354" height="266" fill="#26343c"/>
    <image x="${x}" y="226" width="352" height="264" href="data:image/png;base64,${png.toString('base64')}"/>
    <text x="${x}" y="526" font-size="22" fill="#e6edf3">${title}</text>
    <text x="${x}" y="553" font-size="15" fill="#8b98a5">${platform}</text>`;
}));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0e12"/>
  <rect width="1200" height="6" fill="#3fb950"/>
  <g font-family="DejaVu Sans, sans-serif">
    <text x="48" y="58" font-size="23" fill="#8b98a5">probably<tspan fill="#3fb950">fine</tspan>.dev</text>
    <text x="44" y="151" font-size="84" font-weight="bold" fill="#e6edf3">The arcade<tspan fill="#3fb950">_</tspan></text>
    <text x="48" y="195" font-size="26" fill="#a7b3bf">Old games, playable in your browser.</text>
    ${panels.join('\n')}
    <text x="48" y="603" font-size="22" fill="#3fb950">probablyfine.dev/arcade</text>
    <text x="1152" y="603" text-anchor="end" font-size="17" fill="#8b98a5">Hosted on my own cluster</text>
  </g>
</svg>`;
await mkdir('public/og', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('public/og/arcade.png');
console.log('og: arcade');
