// Regenerate brand images from their SVG sources.
//   scripts/og.svg      -> public/og.png (1200x630 social card)
//   public/favicon.svg  -> favicon PNGs + apple-touch icon
// Run: pnpm og
import sharp from 'sharp';

await sharp('scripts/og.svg', { density: 150 }).resize(1200, 630).png().toFile('public/og.png');
await sharp('public/favicon.svg', { density: 384 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp('public/favicon.svg', { density: 384 }).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp('public/favicon.svg', { density: 384 }).resize(16, 16).png().toFile('public/favicon-16.png');

console.log('brand images regenerated');
