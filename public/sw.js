// Service Worker for ReciclaE Offline Functionality

const CACHE_NAME = 'recicla-e-pwa-v1.3';
const CACHE_TIMEOUT = 3000; // 3 segundos de timeout para tentar rede

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

console.log('[SW v1.3] Service Worker carregado');

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

// Fetch event - Network First strategy for app files, Cache First for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests (let them go to network)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  const url = new URL(event.request.url);
  const isAppFile = url.pathname.endsWith('.html') || 
                    url.pathname.endsWith('.js') || 
                    url.pathname.endsWith('.css') ||
                    url.pathname === '/';
  
  // Para arquivos da aplicação (HTML/JS/CSS), usar Network First
  if (isAppFile) {
    event.respondWith(
      // Tentar rede primeiro com timeout
      Promise.race([
        fetch(event.request).then((response) => {
          // Cachear a nova versão
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          console.log('[SW] Serving from network (fresh):', event.request.url);
          return response;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), CACHE_TIMEOUT)
        )
      ]).catch((error) => {
        // Se rede falhar ou timeout, usar cache como fallback
        console.log('[SW] Network failed, using cache fallback:', event.request.url);
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Se não tiver em cache e for HTML, retornar index
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          throw error;
        });
      })
    );
  } else {
    // Para assets (imagens, ícones), usar Cache First
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('[SW] Serving asset from cache:', event.request.url);
          return response;
        }
        
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
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