import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { AI_ROLES } from './lib/aiRole';

// Blog posts. One Markdown/MDX file per post in src/content/posts/.
// This is the canonical source the site renders the blog index and post pages from.
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    // What a model actually did on this post. See src/lib/aiRole.ts and /blog/how-i-use-ai.
    // Replaced a boolean that was true on every post and therefore said nothing.
    aiRole: z.enum(AI_ROLES).default('none'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
