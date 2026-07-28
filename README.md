# ProbablyFine

The homelab + SRE engineering blog at [probablyfine.dev](https://probablyfine.dev).
Architecture deep-dives, incident post-mortems, and honest notes on AI-assisted engineering.

Sister site to [maxfieldallison.com](https://maxfieldallison.com) (the professional hub).

## Stack

- **[Astro](https://astro.build/)** 7 + **[Tailwind](https://tailwindcss.com/)** v4, static output
- Content collection (`src/content/posts/`) with typed frontmatter
- **Hybrid hosting:** static build → nginx container → Kubernetes (ArgoCD) + Traefik,
  with a Cloudflare Pages failover mirror

## Develop

```bash
pnpm install
pnpm dev        # local dev server
pnpm build      # static build to dist/
pnpm preview    # preview the build
```

## Writing a post

Add a Markdown/MDX file to `src/content/posts/`:

```markdown
---
title: "Post title"
description: "One-line summary for cards, meta, and RSS."
date: 2026-07-28
tags: ["kubernetes", "incident"]
aiAssisted: false   # set true when written with an AI agent in the loop
draft: false
---

Body in Markdown.
```

## Development approach

This site is built with AI-assisted engineering: the architecture, technology choices, and
review are human; an AI agent helps implement faster. Posts written that way are tagged
`ai-assisted`.

## License

MIT
