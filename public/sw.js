// Service Worker for ReciclaE Offline Functionality

const CACHE_NAME = 'recicla-e-pwa-v1.2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-48x48.png',
  '/icon-72x72.png',
  '/icon-96x96.png', 
  '/icon-144x144.png',
  '/icon-168x168.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/logo-original.png',
  // Dynamic assets will be cached as they're requested
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Error caching resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests (let them go to network)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }

        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[SW] Fetch failed:', error);
          // Return a fallback response for HTML requests
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          throw error;
        });
      })
  );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Notify the app to sync pending operations
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC' });
        });
      })
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});