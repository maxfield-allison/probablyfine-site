// The security headers for probablyfine.dev: the one place they are defined.
//
// The site is served from two places. nginx.conf covers the Kubernetes origin;
// public/_headers covers the Cloudflare Pages mirror that takes over when the
// origin is down. Pages does not read nginx.conf, so both files have to carry
// the policy. Both are now generated from this module by
// scripts/shared/headers.mjs, and the build fails if either one disagrees with
// it. Edit here, then run `pnpm headers` to rewrite them.
//
// Shape:
//   headers  every response, both origins
//   scopes   path prefixes with their own additions or replacements. `path` is
//            an nginx prefix location; the Pages rule is the same prefix with a
//            trailing `*`. A header set to null is removed for that scope.
//
// CSP values are written as { directive: [sources] }; an empty list is a bare
// directive such as upgrade-insecure-requests.

// script-src is 'self' plus comments.probablyfine.dev, which supplies blog
// comments. Everything of mine is same-origin: the one behavioural script
// lives at /js/read-tracker.js specifically so no inline script is needed. If
// you add an inline <script> this policy will block it; move the code to
// public/js/ instead of weakening the policy.
//
// The comment widget used to be giscus, which rendered inside an iframe and so
// needed frame-src rather than much else. Comentario is a web component that
// runs in this page's own origin, so it needs script-src, style-src and
// connect-src instead, and needs no frame-src at all. That is a wider grant,
// and it is acceptable only because that host is ours. Do not hand the same
// three directives to a third party.
//
// style-src needs 'unsafe-inline': Astro emits a small inline <style> block
// and view transitions set inline style attributes, which cannot be hashed.
// Inline style is a far weaker vector than inline script. The comments host is
// listed there too because the widget ships its own stylesheet.
//
// img-src carries the comments host for commenter avatars. Whether they are
// proxied through that host or served from the OAuth provider needs checking
// against the live instance; if avatars break, that is the first thing to look
// at, not the last.
//
// frame-src allows arcade.probablyfine.dev, which hosts the emulator frames.
const COMMENTS = 'https://comments.probablyfine.dev';

const siteCsp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", COMMENTS],
  'style-src': ["'self'", "'unsafe-inline'", COMMENTS],
  'img-src': ["'self'", 'data:', COMMENTS],
  'font-src': ["'self'"],
  'connect-src': ["'self'", COMMENTS],
  'frame-src': ["'self'", 'https://arcade.probablyfine.dev'],
  'frame-ancestors': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

export default {
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // SAMEORIGIN rather than DENY: the edge already sends SAMEORIGIN, and two
    // different values across the chain is worse than one slightly looser
    // one. Real framing control comes from frame-ancestors.
    'X-Frame-Options': 'SAMEORIGIN',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()',
    'Content-Security-Policy': siteCsp,
  },

  scopes: [
    {
      path: '/arcade',
      note: [
        'The Mac emulator needs shared-memory isolation. Full navigations at',
        'this boundary ensure the browser applies these headers.',
      ],
      tryFiles: '$uri $uri.html $uri/index.html @notfound',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    {
      path: '/zeroday/',
      note: [
        'The ZERO/DAY playtest build ships as a single self-contained HTML file',
        'with an inline script. Rather than weaken script-src for the whole',
        'site, this path gets its own policy.',
      ],
      tryFiles: '$uri $uri/index.html =404',
      headers: {
        'Content-Security-Policy': {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:'],
          'font-src': ["'self'"],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'self'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'object-src': ["'none'"],
        },
      },
    },
  ],
};
