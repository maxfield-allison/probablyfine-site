import { createResponse } from '/js/response-effect.js';
import { mountAtlas } from './atlas.mjs';
import { createPathStore } from './path-store.mjs';
const $ = (id) => document.getElementById(id);
const api = await window.chronochasm.ready;
const { data } = api;
const byId = new Map(data.moments.map((m) => [m.id, m]));
const tones = new Map(data.lanes.map((l) => [l.id, l.color]));
const response = createResponse(document.body, { paused: api.motionPaused });
let storage;
try {
  storage = localStorage;
} catch {
  storage = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
    removeItem() {
      throw Error();
    },
  };
}
const path = createPathStore(data, storage, (message) => {
  $('path-storage').textContent = message;
});
const initialLast = path.state.last;
const countLabel = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
function node(tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}
function refreshTraces() {
  const state = path.state;
  for (const el of document.querySelectorAll('#marks [data-moment]')) {
    el.classList.toggle('has-trace', state.moments.includes(el.dataset.moment));
    el.classList.toggle(
      'has-source',
      byId
        .get(el.dataset.moment)
        ?.sources.some((id) => state.sources.includes(id)) ?? false,
    );
  }
  for (const button of document.querySelectorAll('#story [data-source]')) {
    const seen = state.sources.includes(button.dataset.source);
    button.classList.toggle('source-opened', seen);
    // Preserve the published source label and expose the added state without color.
    if (seen)
      button.setAttribute('aria-label', `${button.textContent} · opened`);
    else button.removeAttribute('aria-label');
  }
  $('remember-path').checked = path.remembering;
  $('open-path').textContent = state.moments.length
    ? `Your path · ${state.moments.length} moments`
    : 'Your path';
  $('path-context').textContent = state.moments.length
    ? `${countLabel(state.moments.length, 'moment')} opened · ${countLabel(state.sources.length, 'source')} explored`
    : 'A new path through the record';
}
function drawMap(state) {
  const svg = $('path-map');
  svg.replaceChildren();
  const ids = state.moments.slice(-12);
  const positions = new Map(
    ids.map((id, i) => [
      id,
      {
        x: 30 + (i * 600) / Math.max(1, ids.length - 1),
        y: 90 + Math.sin(i * 1.8) * 46,
      },
    ]),
  );
  function shape(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs))
      el.setAttribute(key, value);
    svg.append(el);
    return el;
  }
  for (const rel of data.relations) {
    const a = positions.get(rel.from),
      b = positions.get(rel.to);
    if (a && b)
      shape('path', {
        d: `M${a.x},${a.y} Q${(a.x + b.x) / 2},12 ${b.x},${b.y}`,
        stroke: tones.get(byId.get(rel.to).lane),
        fill: 'none',
        opacity: 0.45,
      });
  }
  for (const [id, p] of positions) {
    const m = byId.get(id),
      color = tones.get(m.lane);
    shape('circle', {
      cx: p.x,
      cy: p.y,
      r: id === state.last ? 10 : 6,
      fill: '#0a0e12',
      stroke: color,
      'stroke-width': 2,
    });
    if (m.sources.some((s) => state.sources.includes(s)))
      shape('path', {
        d: `M${p.x},${p.y - 22} l4,4 -4,4 -4,-4 Z`,
        fill: color,
      });
    const label = shape('text', {
      x: p.x,
      y: p.y + 30,
      'text-anchor': 'middle',
      fill: '#aab7c0',
      'font-size': 11,
    });
    label.textContent = String(state.moments.indexOf(id) + 1).padStart(2, '0');
  }
}
function renderPath() {
  const state = path.state;
  $('path-summary').textContent = state.moments.length
    ? `${countLabel(state.moments.length, 'moment')} opened, ${countLabel(state.sources.length, 'source')} explored. Your first-open sequence is listed below; the map shows the last twelve.`
    : 'Open a moment and follow what interests you. Your route will appear here.';
  drawMap(state);
  const list = $('path-list');
  list.replaceChildren();
  for (const id of state.moments) {
    const m = byId.get(id),
      item = node('li', ''),
      button = node('button', m.title);
    button.dataset.return = id;
    button.addEventListener('click', () => {
      $('path-dialog').close();
      api.openMoment(id);
    });
    item.append(button);
    if (m.sources.some((s) => state.sources.includes(s)))
      item.append(node('span', 'Source explored', 'trace-label'));
    list.append(item);
  }
  refreshTraces();
}
function openPath() {
  renderPath();
  $('path-dialog').showModal();
}
for (const id of ['open-path', 'reader-path']) {
  $(id).disabled = false;
  $(id).addEventListener('click', openPath);
}
$('close-path').addEventListener('click', () => $('path-dialog').close());
$('remember-path').addEventListener('change', (e) => {
  path.remember(e.target.checked);
  refreshTraces();
});
$('forget-path').addEventListener('click', () => {
  path.clear();
  $('resume-path').hidden = true;
  renderPath();
});
$('begin-thread').disabled = false;
$('begin-thread').addEventListener('click', () =>
  api.openMoment('remembering'),
);
if (initialLast) {
  $('resume-path').hidden = false;
  $('resume-path').disabled = false;
  $('resume-path').textContent = `Return to: ${byId.get(initialLast).title}`;
  $('resume-path').addEventListener('click', () => api.openMoment(initialLast));
}
function attend(id) {
  const m = byId.get(id);
  if (!m) return;
  document.body.style.setProperty('--attention', tones.get(m.lane));
  document.body.dataset.attentive = 'true';
}
document.addEventListener('chronochasm:story', (e) => {
  const { id, article } = e.detail;
  path.open(id);
  refreshTraces();
  response.arrive(article, tones.get(byId.get(id).lane));
  // A finite pulse follows only existing relationships; it does not invent a causal edge.
  if (
    !matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !api.motionPaused()
  ) {
    document.querySelectorAll('#marks .connection.related').forEach((line) => {
      line.classList.remove('connection-arrival');
      void line.getBoundingClientRect();
      line.classList.add('connection-arrival');
    });
  }
});
document.addEventListener('chronochasm:render', refreshTraces);
document.addEventListener('chronochasm:source', (e) => {
  path.source(e.detail.id);
  refreshTraces();
  response.arrive(
    $('source-selection'),
    tones.get(byId.get(e.detail.moment).lane),
  );
});
document.addEventListener('chronochasm:motion', () => {
  response.stop();
  document.body.classList.toggle('response-still', api.motionPaused());
  document
    .querySelectorAll('.connection-arrival')
    .forEach((el) => el.classList.remove('connection-arrival'));
});
for (const type of ['pointerover', 'focusin'])
  $('marks').addEventListener(type, (e) => {
    const target = e.target.closest('[data-moment]');
    if (target) attend(target.dataset.moment);
  });
$('marks').addEventListener('pointerleave', () => {
  if (api.getSelected()) attend(api.getSelected());
  else document.body.dataset.attentive = 'false';
});
// Hash loading can open a passage before the ready promise's microtask runs.
if (api.getSelected()) {
  path.open(api.getSelected());
  attend(api.getSelected());
}
refreshTraces();

mountAtlas(api, path);
