// ── BUMP THIS STRING ON EVERY NEW DEPLOYMENT to purge stale caches ────────────
const CACHE = 'summer-grind-v2026-06-21'

const PRECACHE = ['/', '/index.html']

// ── Install: precache shell ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// ── Activate: purge all caches with a different name ──────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch strategies ──────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Navigation (HTML): Stale-While-Revalidate so offline gets cached shell
  // and online users always get fresh HTML in the background.
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Hashed Vite assets (/assets/*.js, /assets/*.css): cache-first.
  // These are content-addressed — a new build uses new filenames,
  // so serving a cached copy is always correct for that URL.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Everything else (icons, manifest, etc.): network-first, cache fallback.
  event.respondWith(networkFirst(request))
})

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE)
  const cached = await cache.match(request)

  // Kick off a background revalidation regardless
  const networkFetch = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  // Return cached immediately if available, otherwise await network
  return cached ?? (await networkFetch) ?? cache.match('/index.html')
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? Response.error()
  }
}
