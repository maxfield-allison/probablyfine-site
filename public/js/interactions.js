// Navigation-intent signals: which route into a page a reader actually took.
//
// A pageview already records that someone arrived at a post. It does not record
// whether they got there from the home list, the blog index, a tag page, the
// related-posts block, or the older/newer arrows at the foot of another post —
// and that difference is the whole question "how do people move through this
// site?" is asking.
//
// WHY THIS IS NOT `data-umami-event`. Umami's own click handler calls
// preventDefault() on any <a> carrying that attribute and then re-navigates with
// `location.href = …` once the request settles. On a site running Astro's
// ClientRouter that converts a client-side view transition into a full page
// load — slower, and it throws away the transition. So internal links use a
// separate `data-track` namespace that Umami ignores, and this file reports them
// with umami.track() while the browser handles the click normally.
//
// `data-umami-event` is still the right tool everywhere it does not fight
// navigation: buttons, <summary>, the lightbox arrows, mailto and outbound
// links. Those are left declarative.
//
// Static file in public/ for the same CSP reason as read-tracker.js: an inlined
// Astro script pins a sha256 hash that silently breaks the next time it is
// edited. No PII — every value reported here is a slug, a tag or a fixed label
// already visible on the page. No-ops when the tracker is absent or blocked.
(() => {
  const ATTR = 'data-track';

  // One capture-phase listener, bound once for the life of the tab. ClientRouter
  // swaps the document's contents rather than reloading, so a per-page binding
  // would stack a new listener on every navigation and count one click twice.
  //
  // The flag lives on `window` and not on a DOM attribute on purpose: the
  // document element's attributes are re-applied from the incoming page during a
  // view transition, so a flag stored there can be wiped and the guard silently
  // stops guarding. `window` survives everything short of a real page load.
  if (window.__interactionsBound) return;
  window.__interactionsBound = true;

  document.addEventListener(
    'click',
    (event) => {
      const el = event.target instanceof Element && event.target.closest(`[${ATTR}]`);
      if (!el) return;

      const name = el.getAttribute(ATTR);
      if (!name || !window.umami) return;

      // data-track-where="home" → { where: 'home' }. Anything not prefixed is
      // ignored, so an element can carry unrelated data attributes safely.
      const data = {};
      for (const attr of el.getAttributeNames()) {
        if (attr.startsWith(`${ATTR}-`)) {
          data[attr.slice(ATTR.length + 1)] = el.getAttribute(attr);
        }
      }

      // Deliberately fire-and-forget, and deliberately NOT awaited: the click
      // proceeds normally whether or not this request lands. A signal that can
      // delay a reader's navigation is not worth having.
      try {
        window.umami.track(name, data);
      } catch {
        /* analytics must never break a link */
      }
    },
    true
  );
})();
