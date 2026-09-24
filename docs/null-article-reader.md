# Null article reader

The article at `/blog/why-i-created-null` contains three aligned versions, passage comparisons, a full comparison document, and four Markdown downloads. It uses the existing post shell. It was published on 2026-09-23.

## Preview and check

```sh
pnpm install --frozen-lockfile
SHOW_DRAFTS=1 pnpm build
pnpm preview --host 127.0.0.1 --port 4347
node scripts/null-article-smoke.mjs
```

The smoke script accepts `NULL_PREVIEW_URL` (loopback only), `CHROMIUM_EXECUTABLE` for an already installed browser, and optional `NULL_SCREENSHOT_DIR` for screenshots. It blocks external browser requests, including analytics and comments. Use a disposable local browser context; the script creates and closes it automatically. On Astro versions that detach the preview server, stop it with `pnpm exec astro preview stop`.

Now that the article is published, run the smoke script against an ordinary `pnpm build` with `NULL_EXPECT_PUBLISHED=1`, which requires the page to be indexable. Never deploy a `SHOW_DRAFTS=1` build as a production build.

## Sources and alignment

- `src/content/article-versions/null/` holds the two preserved early snapshots and the current revised article and a public adaptation of the comparison. The original dictation retains its supplied punctuation and spelling. The comparison omits private workspace references and links to the local Markdown downloads.
- `src/content/posts/why-i-created-null.md` provides the post metadata and current revised article, including its final AI-use note for normal site discovery, reading time, and the existing editorial gates. Keep its complete body synchronized with `assisted-researched.md` (the existing download filename is retained). The reader renders the current note once after the comparison document, independently of version selection; the process-note modal also includes it.
- `src/lib/null-article.ts` defines 23 ordered passage boundaries and short AI-assisted change notes. Boundaries consume each snapshot once in order, with related paragraphs grouped where editing changed the order of ideas. A build fails if any paragraphs remain unmapped.
- `src/components/NullArticle.astro` renders repository-authored Markdown at build time. No fetched HTML or reader-supplied text enters the HTML renderer.

Once JavaScript is ready, the three cells occupy the same CSS grid row. Inactive cells remain part of layout but are invisible, inert, and hidden from assistive technology. Each row reserves the tallest version's height. This deliberately leaves blank space in shorter versions so toggling does not move subsequent passages. It aligns ideas, not individual words or line breaks. Without JavaScript, the revised article is shown normally and all four documents and the full comparison remain accessible. Print removes reserved space for inactive versions.

The native dialog opens from a passage button or a pointer click on original text. Selecting text and following source links do not open it. Escape and Close return focus to the passage button; the full-comparison link opens the document and transfers focus to its summary. Native modal behavior handles background inertness. No screen-reader conformance claim follows from browser checks alone.

The smoke journey checks rendered-source preservation, all four downloads, fixed passage geometry at 1280/375/320 pixels, version state, keyboard activation, pointer activation, text selection, modal focus restoration, full diffs, client navigation, analytics failure, printing, and the no-JavaScript fallback.

## Editing after publication

The preserved historical versions include their original uncertainty and placeholders.

The original and edited snapshots retain their historical process notes. Earlier revisions of the third version remain in git history, not a fourth tab. A separate page-level note beginning `**How this one was made.**` now follows the full comparison and remains visible whichever version is selected. Its text comes from the canonical post's final paragraph, satisfying the site's publication-note format without altering the first two historical documents. Regenerate the exact diffs whenever the revised article changes: `python3 scripts/update-null-comparison.py`; verify with `--check`. The guide and passage notes require editorial review as well. 
The three added click counters (`post-version`, `post-comparison`, `post-document`) use only fixed public identifiers. They follow the existing best-effort analytics behavior and are declared in the tracking check and privacy page. No passage text or reading position is sent by these events.
