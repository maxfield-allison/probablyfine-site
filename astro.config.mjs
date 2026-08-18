// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// A deliberately narrow shell-session theme. A real terminal is not a rainbow,
// and the job here is to separate what was typed from what came back, not to
// reimplement an editor theme. Five roles, matching the --color-code-* tokens
// in global.css: output/plain, comments, strings, flags and arguments, and the
// command itself. Kept as a literal so it needs no import from shiki, which is
// a literal rather than built with shiki's helpers; shiki itself is a
// devDependency only so these JSDoc types resolve.
/** @type {import('shiki').ThemeRegistrationRaw} */
const sessionTheme = {
  name: 'probablyfine-session',
  type: 'dark',
  colors: {
    'editor.foreground': '#8b98a5',
    'editor.background': '#11161c',
  },
  settings: [
    { settings: { foreground: '#8b98a5' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6e7a87' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#7ee787' },
    },
    {
      scope: [
        'constant.other.option',
        'variable.parameter',
        'constant.numeric',
        'keyword.operator',
        'punctuation.separator',
      ],
      settings: { foreground: '#e3b341' },
    },
    {
      scope: [
        'entity.name.function',
        'entity.name.command',
        'support.function',
        'meta.function-call',
        'keyword.control',
        'variable.other',
      ],
      settings: { foreground: '#3fb950' },
    },
  ],
};

// Wrap every fenced block in the session chrome: a label bar naming where the
// command ran, then the code. Metadata comes off the fence info string, e.g.
//
//   ```bash host=pve-00
//   ```text title="journalctl · ceph-osd@8" kind=output
//
// Falls back to the language name, so an unannotated fence still renders as a
// well-formed block rather than an empty bar.
/** @type {import('shiki').ShikiTransformer} */
const sessionBlock = {
  name: 'session-block',
  /** @param {any} node */
  root(node) {
    const raw = this.options.meta?.__raw ?? '';
    const lang = this.options.lang ?? 'text';
    const title =
      /title="([^"]+)"/.exec(raw)?.[1] ?? /host=(\S+)/.exec(raw)?.[1] ?? lang;
    const kind = /kind=(\S+)/.exec(raw)?.[1] ?? lang;
    const pre = node.children.find(
      /** @param {any} c */ (c) => c.tagName === 'pre',
    );
    if (!pre) return;
    node.children = [
      {
        type: 'element',
        tagName: 'div',
        properties: { class: 'session' },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { class: 'session-bar' },
            children: [
              { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: title }] },
              {
                type: 'element',
                tagName: 'span',
                properties: { class: 'session-kind' },
                children: [{ type: 'text', value: kind }],
              },
            ],
          },
          pre,
        ],
      },
    ];
  },
};

// https://astro.build/config
export default defineConfig({
  // Short stable alias for the AI policy. It is the URL that gets pasted into
  // disclosure prompts and profiles, so it should not change if the post is
  // ever renamed or replaced.
  redirects: { '/ai': '/blog/how-i-use-ai' },
  site: 'https://probablyfine.dev',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: sessionTheme,
      transformers: [sessionBlock],
      wrap: false,
    },
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
  },
});
