import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
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
    // Post genre. Absent on ordinary posts. `tutorial` adds the header chip and
    // enables the "what you end up with" panel below.
    genre: z.enum(['tutorial']).optional(),
    // Tutorial finish line: one sentence saying what the reader will have, and
    // the command whose output proves it. Rendered after the post header.
    outcome: z
      .object({
        summary: z.string(),
        command: z.string(),
        // Where the command runs, shown in the session bar like a fence's host=.
        host: z.string().optional(),
      })
      .optional(),
  }),
});

const social = defineCollection({
  loader: file('./src/data/social.json'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(true),
    caption: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.object({
      src: z.string().startsWith('/images/social/'),
      alt: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }).optional(),
    processNote: z.string().min(1),
  }),
});

export const collections = { posts, social };
