import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts. One Markdown/MDX file per post in src/content/posts/.
// This is the canonical source the site renders the blog index and post pages from.
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    // Mark posts written with AI assistance — on-brand and honest (see AI-ASSISTED-ENGINEERING).
    aiAssisted: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
