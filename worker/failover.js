/**
 * Origin failover Worker for probablyfine.dev.
 *
 * K8s homelab is the primary origin. If it is unreachable or returns a 5xx,
 * fall back to the Cloudflare Pages mirror. Both serve the identical static
 * build, so the switch is invisible to visitors.
 *
 * Bound to the apex + www via routes in wrangler.toml. Configure the two
 * origins with vars PRIMARY_ORIGIN and FALLBACK_ORIGIN.
 */

const TIMEOUT_MS = 3000;

async function fetchWithTimeout(url, request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const primary = `https://${env.PRIMARY_ORIGIN}${url.pathname}${url.search}`;
    const fallback = `https://${env.FALLBACK_ORIGIN}${url.pathname}${url.search}`;

    // Try the K8s origin first.
    try {
      const res = await fetchWithTimeout(primary, request, TIMEOUT_MS);
      if (res.status < 500) {
        return res;
      }
    } catch (_) {
      // network error / timeout -> fall through to mirror
    }

    // Primary down or 5xx: serve from the Pages mirror.
    const mirror = await fetch(fallback, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });
    const out = new Response(mirror.body, mirror);
    out.headers.set('X-Served-By', 'pages-fallback');
    return out;
  },
};
