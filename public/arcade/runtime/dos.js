/* This document is destroyed when the parent stops a game or navigates away.
 * Workers, audio, event listeners and in-flight fetches belong to that document.
 */
const slug = new URLSearchParams(location.search).get('game');
const allowed = new Set(['hocus-pocus', 'mystic-towers', 'grand-theft-auto', 'x-wing', 'hand-of-fate', 'busytown', 'grand-theft-auto-2']);
const parentOrigin = document.referrer ? new URL(document.referrer).origin : location.origin;
const notify = (type, detail) => parent.postMessage({ type, detail }, parentOrigin);
let player;
let bundleUrl;

async function run() {
  if (!allowed.has(slug)) throw new Error('Unknown game.');
  const base = `/arcade/assets/${slug}/`;
  const response = await fetch(base + 'bundle.json');
  if (!response.ok) throw new Error('The game files are unavailable. Please try again.');
  const manifest = await response.json();
  let downloaded = 0;
  const chunks = [];
  // Sequential downloads bound memory and avoid monopolising a slow connection.
  for (const part of manifest.parts) {
    const response = await fetch(base + part.url);
    if (!response.ok) throw new Error('The download was interrupted. Please try again.');
    const reader = response.body.getReader();
    const buffers = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffers.push(value);
      length += value.length;
      downloaded += value.length;
      document.querySelector('#progress').value = Math.round(downloaded / manifest.bytes * 100);
      notify('arcade-progress', Math.round(downloaded / manifest.bytes * 100));
    }
    if (length !== part.bytes) throw new Error('An incomplete game file was received. Please try again.');
    const buffer = new Uint8Array(length);
    let offset = 0;
    for (const chunk of buffers) { buffer.set(chunk, offset); offset += chunk.length; }
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), x => x.toString(16).padStart(2, '0')).join('');
    if (digest !== part.sha256) throw new Error('A game file failed its integrity check. Please try again.');
    chunks.push(buffer);
  }
  let bundle = new Blob(chunks, { type: 'application/zip' });
  if (slug === 'grand-theft-auto-2') {
    // The published bundle names the production origin. Adapt its local disk
    // URL for previews too; no remote disk service is contacted by the player.
    emulators.pathPrefix = '/arcade/assets/js-dos/emulators/';
    const bytes = new Uint8Array(await bundle.arrayBuffer());
    const config = await emulators.bundleConfig(bytes);
    config.dosboxConf = config.dosboxConf.replaceAll('https://arcade.probablyfine.dev', location.origin);
    bundle = new Blob([await emulators.bundleUpdateConfig(bytes, config)], { type: 'application/zip' });
  }
  bundleUrl = URL.createObjectURL(bundle);
  document.querySelector('#loading').hidden = true;
  player = Dos(document.querySelector('#dos'), {
    url: bundleUrl,
    pathPrefix: '/arcade/assets/js-dos/emulators/',
    autoStart: true,
    theme: 'dark',
    backend: 'dosboxX',
    backendLocked: true,
    renderAspect: '4/3',
    imageRendering: 'pixelated',
    fsChanges: { local: true, urlToKey: async () => `probablyfine-arcade-${slug}-v1` },
    onEvent(event, ci) {
      if (event === 'ci-ready') {
        notify('arcade-ready');
        ci.events().onExit(() => notify('arcade-exit'));
      }
    },
  });
  player.setNoCloud(true);
}

window.addEventListener('message', event => {
  if (event.origin !== parentOrigin || event.source !== parent) return;
  if (event.data?.type === 'arcade-pause') player?.setPaused(event.data.paused);
  if (event.data?.type === 'arcade-save') {
    Promise.resolve(player?.save()).then(saved => {
      notify(saved ? 'arcade-saved' : 'arcade-save-error');
    }).catch(() => notify('arcade-save-error'));
  }
});
const failed = () => notify('arcade-error', 'The emulator could not start this game. Stop and try again.');
window.addEventListener('error', failed);
window.addEventListener('unhandledrejection', failed);
run().catch(error => {
  document.querySelector('#loading').textContent = error.message;
  notify('arcade-error', error.message);
});
