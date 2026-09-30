import { createResponse } from '/js/response-effect.js';
export function mountAtlas(api, path) {
  const { data } = api;
  const dialog = document.getElementById('atlas');
  const field = dialog.querySelector('.atlas-field');
  const groups = document.getElementById('atlas-groups');
  const svg = document.getElementById('atlas-lines');
  const buttons = new Map();
  const colors = new Map(data.lanes.map((lane) => [lane.id, lane.color]));
  const response = createResponse(dialog, { paused: api.motionPaused });
  function attend(id) {
    const m = data.moments.find((m) => m.id === id);
    const connected = new Set([id]);
    for (const line of svg.children) {
      const related = line.dataset.from === id || line.dataset.to === id;
      line.classList.toggle('atlas-related', related);
      if (related) {
        connected.add(line.dataset.from);
        connected.add(line.dataset.to);
      }
    }
    for (const [key, button] of buttons)
      button.classList.toggle('atlas-connected', connected.has(key));
    dialog.style.setProperty('--attention', colors.get(m.lane));
    document.getElementById('atlas-preview').textContent =
      `${m.title} — ${m.deck}`;
  }
  for (const thread of data.threads) {
    const section = document.createElement('section');
    section.className = 'atlas-group';
    const title = document.createElement('h3');
    title.textContent = thread.name;
    section.append(title);
    const moments = data.moments.filter((m) => m.thread === thread.id);
    for (const [index, m] of moments.entries()) {
      const button = document.createElement('button');
      button.className = 'atlas-node';
      button.dataset.moment = m.id;
      button.style.setProperty('--tone', colors.get(m.lane));
      button.style.setProperty('--node-x', `${12 + index * 18}%`);
      button.style.setProperty(
        '--node-y',
        `${48 + Math.sin(index * 1.9) * 23}px`,
      );
      const number = document.createElement('span');
      number.textContent = String(data.moments.indexOf(m) + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'atlas-name';
      name.textContent = m.title;
      button.append(number, name);
      button.setAttribute('aria-label', m.title);
      button.addEventListener('pointerenter', () => attend(m.id));
      button.addEventListener('focus', () => attend(m.id));
      button.addEventListener('click', () => {
        dialog.close();
        api.openMoment(m.id);
      });
      section.append(button);
      buttons.set(m.id, button);
    }
    groups.append(section);
  }
  function draw() {
    if (!dialog.open) return;
    svg.replaceChildren();
    const bounds = field.getBoundingClientRect();
    svg.setAttribute(
      'viewBox',
      `0 0 ${field.clientWidth} ${field.clientHeight}`,
    );
    for (const rel of data.relations) {
      const from = buttons.get(rel.from).getBoundingClientRect(),
        to = buttons.get(rel.to).getBoundingClientRect();
      const a = {
        x: from.x + from.width / 2 - bounds.x,
        y: from.y + from.height / 2 - bounds.y,
      };
      const b = {
        x: to.x + to.width / 2 - bounds.x,
        y: to.y + to.height / 2 - bounds.y,
      };
      const line = document.createElementNS(svg.namespaceURI, 'path');
      line.setAttribute(
        'd',
        `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2 + 50} ${b.x},${(a.y + b.y) / 2 - 50} ${b.x},${b.y}`,
      );
      line.setAttribute(
        'stroke',
        colors.get(data.moments.find((m) => m.id === rel.to).lane),
      );
      line.dataset.from = rel.from;
      line.dataset.to = rel.to;
      svg.append(line);
    }
  }
  const observer = new ResizeObserver(draw);
  const open = document.getElementById('open-atlas');
  open.disabled = false;
  open.addEventListener('click', () => {
    const state = path.state;
    for (const [id, button] of buttons) {
      const source = data.moments
        .find((m) => m.id === id)
        .sources.some((id) => state.sources.includes(id));
      button.classList.toggle('atlas-opened', state.moments.includes(id));
      button.classList.toggle('atlas-source', source);
      button.setAttribute(
        'aria-label',
        `${data.moments.find((m) => m.id === id).title}${state.moments.includes(id) ? ', opened' : ''}${source ? ', source explored' : ''}`,
      );
    }
    dialog.showModal();
    observer.observe(field);
    draw();
    response.arrive(groups, '#76AABF');
  });
  document
    .getElementById('close-atlas')
    .addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    observer.disconnect();
    response.stop();
  });
  window.addEventListener('pagehide', () => {
    observer.disconnect();
    response.stop();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && dialog.open) observer.observe(field);
  });
}
