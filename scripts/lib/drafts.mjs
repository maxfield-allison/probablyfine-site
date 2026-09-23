// Draft detection outside the content layer, for build steps that read post
// files directly: the sitemap filter in astro.config.mjs and the OG card
// generator. Same frontmatter test as scripts/check-ai-notes.mjs.
//
// Drafts stay out of every production output. `astro dev` shows them, and so
// does a build run with SHOW_DRAFTS=1, which is for local previews only and
// must never be set on the deploy build.

/** True when the post source's frontmatter says `draft: true`. */
export function isDraft(source) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(source);
  return !!fm && /^draft:\s*true\s*$/m.test(fm[1]);
}

/** SHOW_DRAFTS=1 opts a local preview build into rendering drafts. */
export const showDrafts = process.env.SHOW_DRAFTS === '1';
