# Post images

Drop photos for blog posts here. Reference them from a post with a relative path,
for example:

```markdown
![HP EliteDesk running OPNsense on a shelf](./img/2019-opnsense-elitedesk.jpg)
```

Astro optimizes co-located images at build time (resizes, converts, lazy-loads).

## Naming convention

`YYYY-short-slug.jpg` (or `.png`/`.webp`), lowercase, hyphenated. Examples:

- `2019-opnsense-elitedesk.jpg`
- `2021-02-first-rack.jpg`
- `2021-06-loaded-rack.jpg`
- `2021-lab-magnolia-cat.jpg`

## Captions

To add a caption, wrap the image in a figure in the markdown:

```html
<figure>
  <img src="./img/2021-06-loaded-rack.jpg" alt="Fully populated server rack" />
  <figcaption>June 2021, the first fully loaded rack.</figcaption>
</figure>
```

Keep alt text descriptive (it is read aloud by screen readers). Keep originals
reasonably sized; the build will optimize, but do not commit multi-megabyte RAWs.

## Pulling a photo from Immich

The homelab photo library is the source for most post images. Rather than
exporting and resizing by hand:

```bash
pnpm photo:find "server rack"     # find it (plain-language search)
pnpm photo <asset-id> 2026-basement-rack
```

That writes `2026-basement-rack.jpg` here at 1600px with **all metadata stripped**,
including the GPS coordinates phones attach to nearly every photo. It cannot judge
what is visible in the frame — house numbers, plates, screens showing internal
addresses, faces of people who did not agree to appear on a public site. Check that
yourself before committing.

See `scripts/photo-from-immich.mjs`, and
`repos/brain/projects/photo-library/` for how the library is put together.
