let dispose: (() => void) | undefined;
let currentPlayer: HTMLElement | null = null;

function setupPlayer() {
  const player = document.querySelector<HTMLElement>('[data-arcade-player]');
  if (player && player === currentPlayer) return;
  dispose?.();
  if (!player) return;
  currentPlayer = player;
  const listeners = new AbortController();
  const stage = player.querySelector<HTMLElement>('[data-stage]')!;
  const idle = player.querySelector<HTMLElement>('[data-idle]')!;
  const launch = player.querySelector<HTMLButtonElement>('[data-launch]')!;
  const stopButton = player.querySelector<HTMLButtonElement>('[data-stop]')!;
  const fullButton = player.querySelector<HTMLButtonElement>('[data-fullscreen]')!;
  const pauseButton = player.querySelector<HTMLButtonElement>('[data-pause]');
  const saveButton = player.querySelector<HTMLButtonElement>('[data-save]');
  const status = player.querySelector<HTMLElement>('[data-player-status]')!;
  const help = player.querySelector<HTMLElement>('[data-player-help]')!;
  let frame: HTMLIFrameElement | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let paused = false;
  let ready = false;
  let failed = false;
  const isMac = player.dataset.kind === 'mac';
  const source = new URL(player.dataset.src!, location.href);
  const origin = source.origin;

  // Toolbar clicks move focus out of the iframe. Return it when play
  // continues so keys such as Alt reach the emulator's input handler.
  const focusGame = () => {
    if (ready && !paused) frame?.focus({ preventScroll: true });
  };
  const pause = (value: boolean) => {
    paused = value;
    frame?.contentWindow?.postMessage(isMac
      ? { type: value ? 'emulator_pause' : 'emulator_unpause' }
      : { type: 'arcade-pause', paused: value }, origin);
    if (pauseButton) pauseButton.textContent = value ? 'Resume' : 'Pause';
    status.textContent = value ? 'Paused.' : 'Running. Click inside the game to play.';
    focusGame();
  };
  const stop = () => {
    clearTimeout(timeout);
    frame?.remove();
    frame = undefined;
    ready = false;
    failed = false;
    paused = false;
    idle.hidden = false;
    stage.removeAttribute('aria-busy');
    stopButton.disabled = true;
    fullButton.disabled = true;
    if (pauseButton) { pauseButton.disabled = true; pauseButton.textContent = 'Pause'; }
    if (saveButton) saveButton.disabled = true;
    help.hidden = true;
    status.textContent = 'Stopped. Press play to start again.';
    if (document.fullscreenElement === player) void document.exitFullscreen();
  };
  launch.addEventListener('click', () => {
    stop();
    idle.hidden = true;
    stage.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading game…';
    stopButton.disabled = false;
    fullButton.disabled = !player.requestFullscreen;
    frame = document.createElement('iframe');
    frame.title = `${player.dataset.title}, running in an emulator`;
    frame.allow = 'autoplay; fullscreen; gamepad; cross-origin-isolated';
    frame.src = source.href;
    frame.addEventListener('error', () => {
      failed = true;
      status.textContent = 'The player could not load. Stop and try again, or open it in its own tab.';
      help.hidden = false;
      stage.removeAttribute('aria-busy');
    }, { signal: listeners.signal });
    stage.append(frame);
    timeout = setTimeout(() => { if (!ready) help.hidden = false; }, 45000);
  }, { signal: listeners.signal });
  stopButton.addEventListener('click', () => { stop(); launch.focus(); }, { signal: listeners.signal });
  pauseButton?.addEventListener('click', () => pause(!paused), { signal: listeners.signal });
  saveButton?.addEventListener('click', () => {
    saveButton.disabled = true;
    status.textContent = 'Saving disk changes…';
    frame?.contentWindow?.postMessage({ type: 'arcade-save' }, origin);
    focusGame();
  }, { signal: listeners.signal });
  fullButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === player) await document.exitFullscreen();
      else await player.requestFullscreen();
      focusGame();
    } catch { status.textContent = 'Full screen is unavailable in this browser. The player still works here.'; }
  }, { signal: listeners.signal });
  document.addEventListener('fullscreenchange', () => {
    fullButton.textContent = document.fullscreenElement === player ? 'Leave full screen' : 'Full screen';
  }, { signal: listeners.signal });
  // Opening the fallback must not leave the original emulator running too.
  player.querySelector('[data-direct]')?.addEventListener('click', stop, { signal: listeners.signal });
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== origin) return;
    const type = event.data?.type;
    if (type === 'arcade-ready' || type === 'emulator_loaded') {
      if (failed) return;
      ready = true;
      clearTimeout(timeout);
      stage.removeAttribute('aria-busy');
      help.hidden = true;
      status.textContent = isMac ? 'Mac started. Follow the steps below to open the game.' : 'Running. Click inside the game to play.';
      if (pauseButton) pauseButton.disabled = false;
      if (saveButton) saveButton.disabled = false;
      frame.focus();
    } else if (type === 'arcade-saved' || type === 'arcade-save-error') {
      if (saveButton) saveButton.disabled = false;
      status.textContent = type === 'arcade-saved'
        ? 'Disk changes saved in this browser.'
        : 'The disk changes could not be saved. Keep the game open and try again.';
    } else if (type === 'arcade-progress' && !failed && Number.isFinite(event.data.detail)) {
      status.textContent = `Downloading game: ${Math.min(100, Math.max(0, event.data.detail))}%`;
    } else if (type === 'arcade-error') {
      failed = true;
      ready = false;
      if (pauseButton) pauseButton.disabled = true;
      if (saveButton) saveButton.disabled = true;
      status.textContent = typeof event.data.detail === 'string' ? event.data.detail : 'The game could not start.';
      stage.removeAttribute('aria-busy');
      help.hidden = false;
      clearTimeout(timeout);
    } else if (type === 'arcade-exit') {
      stop();
    }
  }, { signal: listeners.signal });
  // This page owns pause state. Mac embeds disable their independent auto-
  // resume behavior so returning to a tab cannot undo a manual pause.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ready && pauseButton && !paused) pause(true);
  }, { signal: listeners.signal });
  dispose = () => { stop(); listeners.abort(); currentPlayer = null; dispose = undefined; };
}
setupPlayer();
document.addEventListener('astro:page-load', setupPlayer);
document.addEventListener('astro:before-swap', () => dispose?.());
window.addEventListener('pagehide', () => dispose?.());
