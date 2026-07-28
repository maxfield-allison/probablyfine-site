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
