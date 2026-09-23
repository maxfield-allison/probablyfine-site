// @ts-check
// Session blocks: how a fenced code block renders on this site.
//
// Lives outside astro.config.mjs so the post page can run the exact same
// pipeline through <Code> (the tutorial "what you end up with" panel) instead
// of hand-building a second, drifting copy of the markup.

// A deliberately narrow shell-session theme. A real terminal is not a rainbow,
// and the job here is to separate what was typed from what came back, not to
// reimplement an editor theme. Five roles, matching the --color-code-* tokens
// in global.css: output/plain, comments, strings, flags and arguments, and the
// command itself. Kept as a literal so it needs no import from shiki, which is
// a literal rather than built with shiki's helpers; shiki itself is a
// devDependency only so these JSDoc types resolve.
/** @type {import('shiki').ThemeRegistrationRaw} */
export const sessionTheme = {
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
      settings: { foreground: '#7e8996' },
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

// A typed command starts with "$ ". The prompt is stripped from the source
// before highlighting and redrawn by CSS as generated content, so it is never
// part of the text: not in a selection, not in the copy button's clipboard,
// not read aloud.
const PROMPT = /^\$(?: |$)/;

/** Fence flags, read with quoted values removed so a title cannot set them. */
function fenceFlags(/** @type {string} */ raw) {
  const bare = raw.replace(/"[^"]*"/g, '');
  return {
    expect: /(?:^|\s)expect(?=\s|$)/.test(bare),
    collapse: Number(/(?:^|\s)collapse=(\d+)/.exec(bare)?.[1] ?? 0),
  };
}

/**
 * @typedef {'cmd' | 'cont' | 'gap' | 'out' | 'plain'} LineKind
 * @typedef {{ kinds: LineKind[], lines: string[], expect: boolean, collapse: number }} SessionState
 */

/** @param {any} ctx */
const stateOf = (ctx) => /** @type {SessionState | undefined} */ (ctx.meta.pfSession);

// Output never goes through the shell grammar: `NAME  STATUS` is not a command
// and should not be coloured like one. It renders as flat text, except for a
// trailing `# ← ...` annotation, which the tutorial genre uses to point at the
// line a reader should see before moving on.
function outputChildren(/** @type {string} */ line) {
  const m = /^(.*?)(\s+#\s*←.*)$/.exec(line);
  if (!m) return [text(line)];
  return [text(m[1]), el('span', { class: 'anno' }, [text(m[2])])];
}

/**
 * Prompt lines, expected output and long-output collapse.
 *
 *   ```bash
 *   $ kubectl get nodes          <- command: prompt gutter, copyable
 *   ```
 *   ```bash expect collapse=8
 *   $ kubectl get pods -A        <- command
 *   NAMESPACE  NAME ...          <- expected output, after a dashed rule;
 *   ...                             lines past 8 fold into <details>
 *   ```
 *
 * A fence with no `$` lines and neither flag is returned untouched, which is
 * every block written before this existed.
 *
 * @type {import('shiki').ShikiTransformer}
 */
export const sessionLines = {
  name: 'session-lines',
  preprocess(code) {
    const { expect, collapse } = fenceFlags(this.options.meta?.__raw ?? '');
    const src = code.split('\n');
    const prompted = src.some((l) => PROMPT.test(l));
    if (!prompted && !expect && !collapse) return;

    /** @type {LineKind[]} */
    const kinds = [];
    const lines = [];
    let inOutput = false;
    let continuing = false;
    for (const line of src) {
      if (!inOutput && PROMPT.test(line)) {
        const cmd = line.replace(PROMPT, '');
        kinds.push('cmd');
        lines.push(cmd);
        continuing = cmd.endsWith('\\');
      } else if (!inOutput && continuing) {
        kinds.push('cont');
        lines.push(line);
        continuing = line.endsWith('\\');
      } else if (!inOutput && expect && line.trim() === '') {
        kinds.push('gap');
        lines.push(line);
      } else {
        if (expect) inOutput = true;
        kinds.push(prompted || expect ? 'out' : 'plain');
        lines.push(line);
      }
    }
    /** @type {any} */ (this.meta).pfSession = { kinds, lines, expect, collapse };
    return lines.join('\n');
  },
  line(node, n) {
    const s = stateOf(this);
    const kind = s?.kinds[n - 1];
    if (!s || !kind || kind === 'plain') return;
    this.addClassToHast(node, kind);
    if (kind === 'out' || kind === 'gap') node.children = outputChildren(s.lines[n - 1]);
  },
  root(node) {
    const s = stateOf(this);
    if (!s) return;
    const pre = /** @type {any} */ (node.children.find((c) => c.type === 'element' && c.tagName === 'pre'));
    const code = pre?.children.find(/** @param {any} c */ (c) => c.tagName === 'code');
    if (!code) return;
    const rows = code.children.filter(/** @param {any} c */ (c) => c.type === 'element');
    if (!rows.length) return;

    /** @param {any[]} part @param {string} [cls] */
    const preOf = (part, cls) => ({
      ...pre,
      properties: cls ? { ...pre.properties, class: `${pre.properties.class} ${cls}` } : pre.properties,
      children: [{ ...code, children: part.flatMap((r, i) => (i ? [text('\n'), r] : [r])) }],
    });

    let head = [];
    let tail = rows;
    const split = s.expect ? s.kinds.indexOf('out') : -1;
    if (split > 0) {
      head = rows.slice(0, split);
      while (head.length && s.kinds[head.length - 1] === 'gap') head.pop();
      tail = rows.slice(split);
    } else if (s.expect && split === -1) {
      // `expect` with nothing after the commands: nothing to split.
      head = rows;
      tail = [];
    }

    const outClass = head.length || s.expect ? 'session-out' : undefined;
    /** @type {any[]} */
    const tailParts = [];
    if (s.collapse && tail.length > s.collapse) {
      const hidden = tail.length - s.collapse;
      tailParts.push(preOf(tail.slice(0, s.collapse), outClass));
      tailParts.push(
        el('details', { class: 'session-more' }, [
          el('summary', {}, [text(`${hidden} more line${hidden === 1 ? '' : 's'}`)]),
          preOf(tail.slice(s.collapse), outClass),
        ]),
      );
    } else if (tail.length) {
      tailParts.push(outClass ? preOf(tail, outClass) : pre);
    }

    if (!head.length) {
      node.children = tailParts;
      return;
    }
    node.children = [
      preOf(head),
      ...(tailParts.length
        ? [el('div', { class: 'session-expect' }, [el('span', {}, [text('expected output')])]), ...tailParts]
        : []),
    ];
  },
};

// Wrap every fenced block in the session chrome: a label bar naming where the
// command ran, then the code. Metadata comes off the fence info string, e.g.
//
//   ```bash host=pve-00
//   ```text title="journalctl · ceph-osd@8" kind=output
//
// Falls back to the language name, so an unannotated fence still renders as a
// well-formed block rather than an empty bar.
//
// A block holding at least one `$` command also gets data-commands, a status
// line and a copy button. The button ships `hidden`: without the copy script
// (no JS, or a page with no commands) there is no button at all, rather than
// one that does nothing.
/** @type {import('shiki').ShikiTransformer} */
export const sessionBlock = {
  name: 'session-block',
  /** @param {any} node */
  root(node) {
    const raw = this.options.meta?.__raw ?? '';
    const lang = this.options.lang ?? 'text';
    const title =
      /title="([^"]+)"/.exec(raw)?.[1] ?? /host=(\S+)/.exec(raw)?.[1] ?? lang;
    const kind = /kind=(\S+)/.exec(raw)?.[1] ?? lang;
    const body = node.children.filter(/** @param {any} c */ (c) => c.type === 'element');
    if (!body.some(/** @param {any} c */ (c) => c.tagName === 'pre')) return;
    const commands = stateOf(this)?.kinds.includes('cmd') ?? false;
    const kindLabel = el('span', { class: 'session-kind' }, [text(kind)]);
    node.children = [
      el('div', commands ? { class: 'session', dataCommands: '' } : { class: 'session' }, [
        el('div', { class: 'session-bar' }, [
          el('span', {}, [text(title)]),
          commands
            ? el('span', { class: 'session-tools' }, [
                el('span', { class: 'session-status', role: 'status' }, []),
                kindLabel,
                el('button', { type: 'button', class: 'session-copy', hidden: true, ariaLabel: 'Copy commands' }, [
                  text('copy'),
                ]),
              ])
            : kindLabel,
        ]),
        ...body,
      ]),
    ];
  },
};

/** Order matters: session-lines reshapes the block, session-block frames it. */
export const sessionTransformers = [sessionLines, sessionBlock];
