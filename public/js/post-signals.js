// Two post-page signals beyond raw pageviews, both anonymous counters:
//
//   note-read      — the "How this one was made" process note entered the
//                    viewport. The AI policy's bet is that per-post notes are
//                    the real disclosure; this measures whether they get read.
//   post-outbound  — a reader clicked an external link inside the article
//                    body (a cited source, not site chrome). Measures whether
//                    readers follow evidence.
//
// Static file in public/ for the same CSP reason as read-tracker.js: an
// inlined Astro script would pin a sha256 hash that silently breaks on edit.
// No PII, no-ops when the tracker is absent or blocked.
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
  });
});
