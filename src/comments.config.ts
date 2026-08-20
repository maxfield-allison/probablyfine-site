// Comentario comments configuration (self-hosted, comments.probablyfine.dev).
//
// Replaces giscus, which stored threads as GitHub Discussions and therefore
// required a GitHub account to leave a sentence on a blog post. See ADR-028.
//
// Comments render ONLY when `host` is set. Until then <Comments /> renders
// nothing, so the site is safe to build and deploy before the backend exists.
//
// To enable (one-time):
//   1. Deploy the backend (homelab-gitops apps/comentario) and let it come up.
//   2. Hit https://comments.probablyfine.dev in a browser. The FIRST visitor
//      becomes superuser, so do this immediately, before anything else finds it.
//   3. Add `probablyfine.dev` as a domain in the admin UI, set its auth
//      providers (anonymous + GitHub first, Google after) and its moderation
//      policy.
//   4. Set `host` below and redeploy.
//
// If you change `host`, change the CSP in BOTH nginx.conf and public/_headers.
// The mirror does not read nginx.conf, so missing one leaves comments working
// on the origin and broken on failover — the day nobody is watching.

export const comments = {
  // Origin of the Comentario instance, no trailing slash. Empty disables the
  // whole feature.
  host: '' as string,

  // Comentario keys threads by page path by default, which is what we want:
  // /blog/<slug> is stable and already the canonical URL.
  //
  // `autoInit` is left on so the web component initialises itself; there is no
  // inline script here on purpose, because an inline script would force a
  // sha256 into the CSP that silently stops matching when this file changes.
  // Same reasoning as public/js/read-tracker.js.
};

export const commentsEnabled = comments.host !== '';

// Convenience for the CSP comments in nginx.conf / public/_headers to point at.
export const commentsOrigin = comments.host;
