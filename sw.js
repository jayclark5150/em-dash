const CACHE = 'em-dash-v26';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
  'https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js',
  'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
  'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Only these origins may be written into the runtime cache. This prevents the
// service worker from persisting arbitrary cross-origin responses (cache poisoning).
const CACHEABLE_ORIGINS = [
  self.location.origin,
  'https://cdn.jsdelivr.net',
];

self.addEventListener('fetch', (e) => {
  // Don't intercept Google API calls
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('accounts.google.com') ||
      e.request.url.includes('apis.google.com')) {
    return;
  }

  // Only handle GET; let the network deal with everything else.
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const url = new URL(e.request.url);
        // Cache only successful, same-origin or allowlisted-CDN, non-opaque responses.
        if (response.ok &&
            response.type !== 'opaque' &&
            CACHEABLE_ORIGINS.includes(url.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
