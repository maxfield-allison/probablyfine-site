# The shared delivery layer

probablyfine-site and personal-site are built and served the same way: an
Astro static build in an nginx container on Kubernetes, a Cloudflare Pages
mirror, and a Worker that fails over between them. Their designs are
separate on purpose. They share plumbing and the response lifecycle, while each site owns its visual treatment.

The shared files are listed in `manifest.json`. **probablyfine-site is the
source of truth.** Change a shared file there, then sync it into
personal-site. A shared file edited only in personal-site is drift, and the
check below reports it.

## What is shared, and how

| Mode | Meaning |
|---|---|
| `verbatim` | Copied byte for byte from probablyfine-site. |
| `template` | Rendered from `templates/<path>`, with `%{name}` replaced by the site's values in `manifest.json` (domain, Pages project, image name). probablyfine-site's own copy is rendered from the same template. |
| `generated` | `nginx.conf` and `public/_headers`, rendered by `headers.mjs` from the site's own `security-policy.mjs`. |
| `hold` | Listed but not synced yet; the manifest gives the reason. |

`perSite` in the manifest lists what stays separate on purpose: the layout,
global CSS, icons, Astro config, Worker routes, and each site's security
policy.

## Visitor response behavior

`public/js/response-effect.js`, `reading-places.js` and `site-response.js` share the finite-motion lifecycle, explicit browser bookmarks and Astro navigation cleanup. Their markup and CSS remain per-site. Chronochasm builds on the same finite-response controller with its own published relationships and optional path storage. Neither reading bookmarks nor path state add an analytics event.

## Security headers

Each site defines its headers once, in `security-policy.mjs` at the repository
root. `headers.mjs` renders both places that serve them:

- `nginx.conf`, for the Kubernetes origin. Any nginx location that sets a
  header drops every inherited one, so the generator restates the full set in
  each scoped location.
- `public/_headers`, for the Pages mirror. Pages applies every matching rule
  and joins repeated headers with a comma, so a scoped rule carries only what
  differs from `/*` and detaches (`! Name`) any header it replaces.

Do not edit either generated file by hand. Edit the policy and run:

```sh
pnpm headers          # rewrite nginx.conf and public/_headers
pnpm check:headers    # what the build runs; exits 1 if they are stale
```

The build runs the check in both repositories, so it needs nothing outside
the repository being built.

## Syncing and checking

From a probablyfine-site checkout:

```sh
node scripts/shared/sync-shared.mjs ../personal-site           # write
node scripts/shared/sync-shared.mjs ../personal-site --check   # exit 1 on drift
node scripts/shared/sync-shared.mjs . --check                  # templated files here
```

From a personal-site checkout, against a probablyfine-site checkout:

```sh
node scripts/shared/sync-shared.mjs --check --source ../probablyfine-site
```

The package scripts wrap the same commands: `pnpm shared:sync ../personal-site`
and `pnpm shared:check ../personal-site` in probablyfine-site, and
`pnpm shared:check ../probablyfine-site` in personal-site.

Whichever copy of the script runs, the manifest, templates and generator come
from the source checkout, so a stale copy cannot pass itself.

The cross-repository check is manual. It needs both checkouts, and neither
repository's CI has the other one.

Node standard library only; no dependencies.
