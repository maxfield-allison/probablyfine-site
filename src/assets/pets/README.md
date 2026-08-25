# Pets page photos

Sources for `/pets`. These live in `src/assets/` rather than `src/content/posts/img/`
because they belong to a page, not a post, and because the page renders them through
`astro:assets` — Astro reads the source, generates the webp variants the grid actually
paints, and the 1200px original never ships.

## Naming

`YYYY-short-slug.jpg`, same convention as the post images, lowercase and hyphenated.
The year is the year the photo was taken. Where an animal has several photos the slug
carries what is in the frame, not a number: `2026-roli-monitor.jpg`,
`2025-tamale-blep.jpg`.

## Getting a photo in here

Never by hand. Everything in this directory came through the import script, which
strips all metadata — 62 of the 64 originals carried GPS coordinates, because these are
photographs taken at home.

```bash
pnpm photo:import --out src/assets/pets --max-edge 1200 --manifest <file.tsv>
pnpm photo:import --out src/assets/pets --max-edge 1200 <source.jpg> 2026-name-of-shot
```

The manifest is tab-separated, `source path` then `output name`, and is worth keeping
for a curated batch: it records which original became which committed file.

For photos coming out of the homelab library, use `pnpm photo` instead — same pipeline
(`scripts/lib/photo.mjs`), different source.

## What the script cannot check

House numbers, plates, screens showing internal addresses, and faces of people who did
not agree to be on a public site. Look at the frame before you commit it.
