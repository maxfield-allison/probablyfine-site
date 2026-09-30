// Shared response grammar: a place of attention, a finite arrival, then rest.
export function createResponse(
  host,
  {
    reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    paused = () => false,
  } = {},
) {
  const animations = new Set();
  const controller = new AbortController();
  const stop = () => {
    for (const animation of animations) animation.cancel();
    animations.clear();
  };
  function arrive(target, tone) {
    host.style.setProperty('--attention', tone);
    host.dataset.attentive = 'true';
    stop();
    if (reduced.matches || paused() || document.hidden) return;
    const animation = target.animate(
      [
        { opacity: 0.6, translate: '0 9px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    animations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
  }
  reduced.addEventListener('change', stop, { signal: controller.signal });
  document.addEventListener('visibilitychange', stop, {
    signal: controller.signal,
  });
  window.addEventListener('pagehide', stop, { signal: controller.signal });
  return {
    arrive,
    stop,
    dispose() {
      stop();
      controller.abort();
    },
  };
}
