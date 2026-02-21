const CACHE_NAME = 'c25k-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/silence.mp3',
  '/manifest.json',
  '/cues/run.m4a',
  '/cues/walk.m4a',
  '/cues/cooldown.m4a',
  '/cues/warmup.m4a',
  '/cues/done.m4a',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;700;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Don't cache API calls
  if (e.request.url.includes('/api/')) {
    return;
  }

  // Network-first for HTML (always get latest), cache-first for assets
  const isHTML = e.request.mode === 'navigate' ||
    e.request.url.endsWith('/') ||
    e.request.url.endsWith('.html');

  if (isHTML) {
    // Try network first, fall back to cache for offline
    e.respondWith(
      fetch(e.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for static assets (audio, fonts, images)
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((response) => {
          if (e.request.url.includes('fonts.gstatic.com') || e.request.url.includes('fonts.googleapis.com')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
  }
});
