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

This repository is **dual-licensed** to keep the code open while protecting the writing:

- **Code** — [MIT](LICENSE). The Astro scaffolding, components, config, and tooling are free
  to reuse. Building your own site from this is welcome.
- **Content** — [CC BY-NC-ND 4.0](LICENSE-CONTENT). The blog posts and prose under
  `src/content/` may be shared with attribution, but not sold, altered, or republished in full.

### Content and branding

The name **"ProbablyFine"**, the domain **probablyfine.dev**, the site's visual identity, and
the author's personal identity and likeness are **not** licensed for reuse. Fork the code, not
the persona.

