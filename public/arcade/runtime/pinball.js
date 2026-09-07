// Upstream waits for a top-level Play click. Our containing page supplied that click.
if (window.parent !== window) {
  Module.postRun.push(() => parent.postMessage({ type: 'arcade-ready' }, new URL(document.referrer).origin));
  document.querySelector('.gui_container').style.display = 'none';
  document.querySelector('.pleasewait').style.display = 'block';
  const script = document.createElement('script');
  script.src = '3DPinballSpaceCadet.js';
  script.onerror = () => parent.postMessage({ type: 'arcade-error', detail: 'The pinball table could not load. Please try again.' }, new URL(document.referrer).origin);
  document.body.append(script);
}
