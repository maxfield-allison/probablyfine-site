import { createResponse } from './response-effect.js';
import { createPlaces, PLACE_PREFIX } from './reading-places.js';
const opened = new Set();
let dispose = () => {};
let still = false;
function mount() {
  dispose();
  const root = document.querySelector('[data-response-root]');
  if (!root) return;
  const controller = new AbortController(),
    { signal } = controller;
  const on = (target, event, callback, options = {}) =>
    target?.addEventListener(event, callback, { ...options, signal });
  const $ = (selector) => root.querySelector(selector);
  const response = createResponse(document.body, { paused: () => still });
  let storage;
  try {
    storage = localStorage;
  } catch {
    storage = {
      get length() {
        throw Error('Unavailable');
      },
      setItem() {
        throw Error('Unavailable');
      },
      removeItem() {
        throw Error('Unavailable');
      },
    };
  }
  const report = (text) => {
    $('[data-place-status]').textContent = text;
    document.querySelector('[data-reading-status]').textContent = text;
  };
  const places = createPlaces(storage, report);
  const tools = $('[data-reading-tools]');
  const content = document.querySelector('[data-reading-content]');
  const current = tools.querySelector('[data-current-section]');
  const path =
    location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const title =
    document.querySelector('h1')?.textContent?.trim() || document.title;
  let heading = '';
  let headingObserver, resizeObserver;
  const header = document.querySelector(
    'header:has(nav[aria-label="Primary"])',
  );
  if (header) {
    resizeObserver = new ResizeObserver(() =>
      document.documentElement.style.setProperty(
        '--response-nav-height',
        `${header.getBoundingClientRect().height}px`,
      ),
    );
    resizeObserver.observe(header);
  }
  let frame = 0;
  const layers = [];
  const cleanups = [];
  const updateMarks = () => {
    const kept = new Set(places.read().map((place) => place.path));
    for (const card of document.querySelectorAll('[data-response]')) {
      const link = card.matches('a[href]')
        ? card
        : card.querySelector('a[href]');
      if (!link) continue;
      const target = new URL(link.href, location.href);
      if (target.origin !== location.origin) continue;
      if (opened.has(target.pathname) || kept.has(target.pathname))
        card.dataset.opened = 'true';
      else delete card.dataset.opened;
    }
  };
  function drawPlaces() {
    const list = $('[data-saved-places]');
    list.replaceChildren();
    const saved = places.read();
    for (const place of saved) {
      const item = document.createElement('li'),
        link = document.createElement('a');
      link.href =
        place.path +
        (place.heading ? '#' + encodeURIComponent(place.heading) : '');
      link.textContent = place.title;
      on(link, 'click', () => $('[data-trail-dialog]').close());
      item.append(link);
      list.append(item);
    }
    if (!saved.length) {
      const item = document.createElement('li');
      item.textContent = 'No saved places yet.';
      list.append(item);
    }
  }
  on($('[data-open-trail]'), 'click', () => {
    drawPlaces();
    $('[data-trail-dialog]').showModal();
  });
  for (const button of root.querySelectorAll('[data-close-dialog]'))
    on(button, 'click', () => button.closest('dialog').close());
  on($('[data-clear-places]'), 'click', () => {
    if (places.clear()) report('Your saved places have been cleared.');
    drawPlaces();
    updateMarks();
  });
  const stillControl = $('[data-response-still]');
  stillControl.checked = still;
  document.documentElement.classList.toggle('response-still', still);
  on(stillControl, 'change', () => {
    still = stillControl.checked;
    document.documentElement.classList.toggle('response-still', still);
    response.stop();
    document.dispatchEvent(new Event('response:still'));
  });
  for (const control of root.querySelectorAll('button:disabled,input:disabled'))
    control.disabled = false;
  if (content) {
    tools.hidden = false;
    content.before(tools);
    opened.add(path);
    // Null's existing sticky version toolbar remains its reading control surface.
    if (content.matches('null-article'))
      tools.classList.add('reading-tools-static');
    const headings = [
      ...content.querySelectorAll('h2[id],h3[id],[data-reading-heading][id]'),
    ].filter((el) => !el.closest('[aria-hidden="true"],[inert],dialog'));
    const nav = $('[data-page-sections]');
    nav.replaceChildren();
    for (const item of headings) {
      const link = document.createElement('a');
      link.href = '#' + encodeURIComponent(item.id);
      link.textContent = item.dataset.readingHeading || item.textContent;
      on(link, 'click', () => {
        $('[data-contents-dialog]').close();
        item.setAttribute('tabindex', '-1');
        item.focus({ preventScroll: true });
      });
      nav.append(link);
    }
    tools.querySelector('[data-open-contents]').disabled = !headings.length;
    const updateHeading = () => {
      frame = 0;
      const cutoff =
        (header?.getBoundingClientRect().height || 64) +
        tools.getBoundingClientRect().height +
        80;
      const active = headings
        .filter((el) => el.getBoundingClientRect().top < cutoff)
        .at(-1);
      heading = active?.id || '';
      current.textContent =
        active?.dataset.readingHeading ||
        active?.textContent ||
        'At the beginning';
      for (const link of nav.children) {
        if (link.hash === '#' + encodeURIComponent(heading))
          link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    headingObserver = new IntersectionObserver(
      () => {
        if (!frame) frame = requestAnimationFrame(updateHeading);
      },
      { rootMargin: '-100px 0px -65% 0px' },
    );
    headings.forEach((el) => headingObserver.observe(el));
    on(
      window,
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(updateHeading);
      },
      { passive: true },
    );
    on(tools.querySelector('[data-open-contents]'), 'click', () =>
      $('[data-contents-dialog]').showModal(),
    );
    on(tools.querySelector('[data-save-place]'), 'click', () => {
      updateHeading();
      const saved = places.save({
        version: 1,
        path,
        title: title.slice(0, 180),
        heading,
      });
      if (saved)
        report('Place saved on this browser. Find it under Your saved places.');
      response.arrive(
        tools,
        getComputedStyle(document.body)
          .getPropertyValue('--color-accent')
          .trim(),
      );
      updateMarks();
    });
    const saved = places.read().find((place) => place.path === path);
    if (saved) {
      const resume = document.createElement('a');
      resume.className = 'reading-resume';
      resume.textContent = 'Return to your saved place →';
      resume.href = saved.heading
        ? '#' + encodeURIComponent(saved.heading)
        : '#main-content';
      tools.append(resume);
    }
    updateHeading();
  }
  // One measured rule per collection; no pointer-following animation loop.
  for (const collection of document.querySelectorAll('[data-response-group]')) {
    const rule = document.createElement('span');
    rule.className = 'response-rule';
    rule.setAttribute('aria-hidden', 'true');
    collection.append(rule);
    layers.push(rule);
    let target;
    const position = () => {
      if (!target) return;
      const a = target.getBoundingClientRect(),
        b = collection.getBoundingClientRect();
      rule.style.top = `${a.top - b.top + collection.scrollTop}px`;
      rule.style.height = `${a.height}px`;
    };
    const attend = (e) => {
      const next = e.target.closest('[data-response]');
      if (!next || !collection.contains(next)) return;
      target = next;
      position();
      collection.dataset.attentive = 'true';
    };
    on(collection, 'pointerover', attend);
    on(collection, 'focusin', attend);
    on(collection, 'pointerleave', () => {
      if (!collection.contains(document.activeElement))
        delete collection.dataset.attentive;
    });
    on(collection, 'focusout', (e) => {
      if (!collection.contains(e.relatedTarget))
        delete collection.dataset.attentive;
    });
    const observer = new ResizeObserver(position);
    observer.observe(collection);
    cleanups.push(() => observer.disconnect());
  }
  for (const details of document.querySelectorAll(
    'main details[data-response-disclosure]',
  ))
    on(details, 'toggle', () => {
      if (details.open) {
        details.dataset.opened = 'true';
        const body = details.querySelector('[data-response-content]');
        if (body)
          response.arrive(
            body,
            getComputedStyle(document.body)
              .getPropertyValue('--color-accent')
              .trim(),
          );
      }
    });
  on(window, 'storage', (e) => {
    if (e.key === null || e.key.startsWith(PLACE_PREFIX)) {
      updateMarks();
      if ($('[data-trail-dialog]').open) drawPlaces();
    }
  });
  updateMarks();
  dispose = () => {
    controller.abort();
    response.dispose();
    headingObserver?.disconnect();
    resizeObserver?.disconnect();
    cleanups.forEach((fn) => fn());
    cancelAnimationFrame(frame);
    layers.forEach((el) => el.remove());
    for (const dialog of root.querySelectorAll('dialog[open]')) dialog.close();
    tools.querySelector('.reading-resume')?.remove();
    tools.hidden = true;
    root.append(tools);
  };
}
document.addEventListener('astro:before-swap', () => dispose());
document.addEventListener('astro:page-load', mount);
window.addEventListener('pagehide', () => dispose());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) mount();
});
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
