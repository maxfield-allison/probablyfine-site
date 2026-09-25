# Short posts

`src/data/social.json` is the source for `/social`, its permalinks, RSS and `/social/feed.json`. Add a unique kebab-case `id`, title, date with offset, caption, tags and a factual process note. Images are optional; when present, put the file under `public/images/social/` and supply dimensions and alt text. Keep drafts marked `draft: true` until reviewed for publication.

The navigation links to Social. Published entries link to longer writing without requiring every caption to become a promotion. Platform adaptations can consume the public version 1 JSON feed; it contains public post content only. A build excludes drafts and future-dated entries from listing, permalinks and both feeds. Rebuild when a future date is reached: this static site is not a scheduler.

Validate with `pnpm build`. Check the index and permalink at narrow and wide viewport sizes, image loading, canonical and Open Graph metadata, JSON and RSS. For text-only posts the normal site image is used for link previews. Privacy version 1.7 documents image, permalink and longer-read clicks; these counts do not establish completed reading or native social engagement.
