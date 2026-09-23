// Copy button for command sessions. The buttons are in the HTML already, built
// `hidden` by the session-block transformer, so a reader without JS sees no
// button rather than a dead one. This reveals them and handles every click with
// one delegated listener. Only `$` lines and their continuations are copied;
// the prompt is CSS generated content, so it is not in the text to begin with.
const reveal = () => document.querySelectorAll('.session-copy[hidden]').forEach((b) => (b.hidden = false));
reveal();
document.addEventListener('astro:page-load', reveal);
document.addEventListener('click', async (e) => {
  const button = e.target instanceof Element ? e.target.closest('.session-copy') : null;
  const session = button?.closest('.session');
  if (!session) return;
  const lines = [...session.querySelectorAll('.line.cmd, .line.cont')].map((l) => l.textContent);
  const status = session.querySelector('.session-status');
  const ok = await navigator.clipboard.writeText(lines.join('\n')).then(() => true, () => false);
  status.textContent = ok ? 'copied' : 'copy failed, select the text instead';
  clearTimeout(status.timer);
  status.timer = setTimeout(() => (status.textContent = ''), 2500);
});
