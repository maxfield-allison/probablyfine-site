// @ts-check
// Post-body markdown extensions, as Sätteri hast plugins.
//
// Astro 7 renders markdown with Sätteri rather than remark/rehype, so these are
// Sätteri plugins: plain visitor objects over the same hast shapes a rehype
// plugin would see. They run after syntax highlighting and before Astro assigns
// heading ids. Each one matches authored syntax that no earlier post uses, so a
// post without that syntax renders exactly as it did before.

/** @typedef {NonNullable<import('@astrojs/markdown-satteri').SatteriProcessorOptions['hastPlugins']>[number]} HastPlugin */

// hast node types, reached through shiki's types (hast itself is not a direct
// dependency).
/** @typedef {import('shiki').ShikiTransformerContext['pre']} HastElement */
/** @typedef {HastElement['children'][number]} HastContent */
/** @typedef {Extract<HastContent, { type: 'text' }>} HastText */

/** @param {string} value @returns {HastText} */
const text = (value) => ({ type: 'text', value });

/**
 * @param {string} tagName
 * @param {HastElement['properties']} properties
 * @param {HastContent[]} children
 * @returns {HastElement}
 */
const el = (tagName, properties, children) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/** @param {any} node */
const firstText = (node) => {
  const first = node.children?.[0];
  return first?.type === 'text' ? first : undefined;
};

// Step headings: `## [3/6] Deploy dnsweaver`.
//
// The `[3/6]` becomes an accent chip and the heading drops its `##` marker (see
// .prose h2.step in global.css). The chip is aria-hidden and a visually hidden
// "Step 3 of 6: " carries the same fact to a screen reader in words, so the
// heading is announced as a sentence rather than as "left bracket 3 slash 6".
// The id is `step-3`, so a link to a step survives a retitled step.
/** @type {HastPlugin} */
export const stepHeadings = {
  name: 'step-headings',
  element: {
    filter: ['h2'],
    visit(node, ctx) {
      const first = firstText(node);
      const m = first && /^\[(\d+)\/(\d+)\]\s+/.exec(first.value);
      if (!first || !m) return;
      const [marker, n, total] = m;
      ctx.setProperty(node, 'className', ['step']);
      ctx.setProperty(node, 'id', `step-${n}`);
      ctx.insertBefore(first, [
        el('span', { className: ['step-chip'], ariaHidden: 'true' }, [text(`${n}/${total}`)]),
        el('span', { className: ['sr-only'] }, [text(`Step ${n} of ${total}: `)]),
      ]);
      ctx.replaceNode(first, text(first.value.slice(marker.length)));
    },
  },
};

// Callouts: a blockquote that opens with a GitHub-style alert marker.
//
//   > [!NOTE]      -> data-kind="note"
//   > [!WARNING]   -> data-kind="warn"
//   > [!VERIFY]    -> data-kind="ok"   (the tutorial genre's checkpoint)
//
// The blockquote keeps its element and gains role="note", a class and a
// data-kind; the marker becomes a visible label. Any other blockquote is left
// alone and still renders as a quotation.
const CALLOUTS = /** @type {const} */ ({
  NOTE: { kind: 'note', label: 'Note' },
  WARNING: { kind: 'warn', label: 'Warning' },
  VERIFY: { kind: 'ok', label: 'Verify' },
});

/** @type {HastPlugin} */
export const callouts = {
  name: 'callouts',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const p = /** @type {any} */ (node.children?.find((c) => c.type === 'element'));
      if (p?.tagName !== 'p') return;
      const first = firstText(p);
      const m = first && /^\[!(NOTE|WARNING|VERIFY)\][ \t]*\n?/i.exec(first.value);
      if (!first || !m) return;
      const { kind, label } = CALLOUTS[/** @type {keyof typeof CALLOUTS} */ (m[1].toUpperCase())];
      ctx.setProperty(node, 'className', ['callout']);
      ctx.setProperty(node, 'dataKind', kind);
      ctx.setProperty(node, 'role', 'note');
      ctx.insertBefore(p, el('p', { className: ['callout-label'] }, [text(label)]));
      const rest = first.value.slice(m[0].length);
      if (!rest && p.children.length === 1) ctx.removeNode(p);
      else ctx.replaceNode(first, text(rest));
    },
  },
};

// Tells the post page whether this body holds a command block, so the copy
// script ships only where there is something to copy. Written into the
// rendered frontmatter, which Astro hands back as `remarkPluginFrontmatter`.
/** @type {HastPlugin} */
export const commandFlag = {
  name: 'command-flag',
  element: {
    filter: ['div'],
    visit(node, ctx) {
      const props = /** @type {Record<string, unknown>} */ (node.properties ?? {});
      if (!('dataCommands' in props) && !('data-commands' in props)) return;
      const astro = /** @type {any} */ (ctx.data).astro;
      if (astro?.frontmatter) astro.frontmatter.hasCommands = true;
    },
  },
};

export const postHastPlugins = [stepHeadings, callouts, commandFlag];
