// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { readdirSync, readFileSync } from 'node:fs';

// Session blocks (fenced code as terminal sessions) and the post-body
// extensions (step headings, callouts). Both live in src/lib so the post page
// can reuse the session pipeline; see the comments there.
import { sessionTheme, sessionTransformers } from './src/lib/session.mjs';
import { postHastPlugins } from './src/lib/markdown.mjs';
import { isDraft } from './scripts/lib/drafts.mjs';

// Draft posts never reach the sitemap, even in a SHOW_DRAFTS preview build,
// where their pages do exist. Read from the source frontmatter because the
// sitemap filter runs outside the content layer.
const draftPaths = new Set(
  readdirSync('src/content/posts')
    .filter((f) => /\.mdx?$/.test(f))
    .filter((f) => isDraft(readFileSync(`src/content/posts/${f}`, 'utf8')))
    .map((f) => `/blog/${f.replace(/\.mdx?$/, '')}`),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://probablyfine.dev',
  integrations: [sitemap({
    filter: (page) => {
      const path = new URL(page).pathname.replace(/\.html$/, '').replace(/\/$/, '');
      if (draftPaths.has(path)) return false;
      // /search is noindex: a results page has nothing of its own to rank.
      if (path === '/search') return false;
      return path !== '/integrations' && !path.startsWith('/integrations/');
    },
  })],
  markdown: {
    shikiConfig: {
      theme: sessionTheme,
      transformers: sessionTransformers,
      wrap: false,
    },
    processor: satteri({ hastPlugins: postHastPlugins }),
  },
  // Prefetch internal links on hover/tap for near-instant navigation. Static
  // pages, so this is just a small HTML fetch primed into cache.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Flat file output (/blog.html, not /blog/index.html) so the static host
  // serves clean URLs without directory redirects. Directory redirects behind a
  // reverse proxy leak the internal origin host:port in the Location header.
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
    // Small processed scripts must remain external: the site's CSP permits
    // same-origin scripts, and intentionally does not allow inline JavaScript.
    build: { assetsInlineLimit: (filePath) => filePath.endsWith('.js') ? false : undefined },
  },
});
