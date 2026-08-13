// Read-completion signal: fires a Umami event once the reader scrolls near the
// end of the page. Powers "read" goals and funnels beyond raw pageviews. No
// PII, fires at most once per page view, and does nothing if the analytics
// tracker is absent (blocked, or not yet loaded).
//
// Deliberately a static file in public/ rather than an Astro <script>. Astro
// inlines small module scripts, and an inline script forces the site's CSP to
// carry a sha256 hash that silently stops matching the moment this file is
// edited — the tracker would just quietly stop reporting. Served as its own
// file, `script-src 'self'` covers it forever.
//
// Config travels in data attributes on [data-read-tracker], written by
// src/components/ReadTracker.astro.
document.addEventListener('astro:page-load', () => {
  const el = document.querySelector('[data-read-tracker]');
  if (!el) return;

  const event = el.dataset.event;
  const key = el.dataset.key || 'id';
  const id = el.dataset.id;
  const threshold = Number(el.dataset.threshold || '0.9');
  if (!event || !id) return;

  let fired = false;
  const onScroll = () => {
    if (fired) return;
    const doc = document.documentElement;
    if ((window.scrollY + window.innerHeight) / doc.scrollHeight < threshold) return;
    fired = true;
    window.removeEventListener('scroll', onScroll);
    if (window.umami) window.umami.track(event, { [key]: id });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
});
