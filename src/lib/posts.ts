import type { CollectionEntry } from 'astro:content';

// Estimate reading time from the raw Markdown body. ~200 wpm, rounded up, min 1.
// Strips code fences and inline markup roughly so the count reflects prose.
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const text = body
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/[#>*_~\-]+/g, ' '); // markdown punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// URL-safe slug for a tag (used for /blog/tags/<slug>).
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build a { tag, slug, count } list across all posts, sorted by count desc.
export function collectTags(posts: CollectionEntry<'posts'>[]) {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.data.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
