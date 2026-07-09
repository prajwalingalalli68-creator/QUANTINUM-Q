const CACHE_NAME = 'quantinum-q-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap'
];

// Install event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core offline assets');
      // Use helper to handle failures individually without failing the whole installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => 
          cache.add(url).catch(err => console.warn(`[Service Worker] Failed to pre-cache asset: ${url}`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Apply caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API routes and WebSocket connections
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return; // Let browser handle it directly
  }

  // Caching Strategy: Stale-While-Revalidate for dynamic assets & imports
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background to update cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch errors (e.g., when offline)
          });
        return cachedResponse;
      }

      // Not in cache: Fetch from network, and cache it if it's a safe GET request
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || event.request.method !== 'GET') {
            return networkResponse;
          }

          // Cache Vite-built assets, ESM modules, fonts, etc.
          const shouldCache = 
            url.origin === self.location.origin || 
            url.host === 'esm.sh' || 
            url.host === 'fonts.gstatic.com' ||
            url.host === 'cdn.jsdelivr.net' ||
            url.host === 'cdnjs.cloudflare.com';

          if (shouldCache) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed offline:', error);
          // If we are offline and fetching the main document or a core route, serve index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw error;
        });
    })
  );
});
