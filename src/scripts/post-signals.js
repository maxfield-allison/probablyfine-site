// Blog reading-note and link counters. Astro emits this script with a content
// hash so the immutable asset cache cannot retain an older implementation.
// Its page-load listener follows ClientRouter navigation; the module runs once.
// Only public link destinations and fixed labels are sent, with no query strings.
document.addEventListener('astro:page-load', () => {
  const article = document.querySelector('article');
  if (!article) return;
  const slug = location.pathname.replace(/^\/blog\//, '');

  // --- note-read: find the process note by its lead-in phrase.
  const lead = Array.from(article.querySelectorAll('p > strong')).find((s) =>
    (s.textContent || '').trim().toLowerCase().startsWith('how this one was made')
  );
  if (lead) {
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((e) => e.isIntersecting)) return;
        fired = true;
        io.disconnect();
        if (window.umami) window.umami.track('note-read', { slug });
      },
      { threshold: 0.5 }
    );
    io.observe(lead.closest('p'));
  }

  // Internal prose and linked figures use the non-blocking site listener.
  article.querySelectorAll('.prose a[href^="/"], .prose a[href^="#"]').forEach((a) => {
    if (a.hasAttribute('data-track')) return;
    const destination = new URL(a.href);
    if (destination.origin !== location.origin) return;
    a.setAttribute('data-track', 'post-internal');
    a.setAttribute('data-track-slug', slug);
    a.setAttribute('data-track-destination', destination.pathname + destination.hash);
    a.setAttribute('data-track-where', a.querySelector('img') ? 'figure' : 'prose');
  });

  // --- post-outbound: tag external links in the body; Umami's delegated
  // click handler does the rest via the data attributes.
  article.querySelectorAll('a[href^="http"]').forEach((a) => {
    let host;
    try {
      host = new URL(a.href).host;
    } catch {
      return;
    }
    if (host === location.host) return;
    a.setAttribute('data-umami-event', 'post-outbound');
    a.setAttribute('data-umami-event-href', host + new URL(a.href).pathname);
    a.setAttribute('data-umami-event-slug', slug);
    a.setAttribute('data-umami-event-where', a.querySelector('img') ? 'figure' : 'prose');
  });
});
