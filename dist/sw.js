const CACHE = 'summer-grind-v1'

const PRECACHE = [
  '/',
  '/index.html',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for navigations, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response
        const clone = response.clone()
        caches.open(CACHE).then(cache => cache.put(request, clone))
        return response
      })
    })
  )
})
