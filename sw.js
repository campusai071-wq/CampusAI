const CACHE_NAME = 'campusai-v3.1-stable';
const OFFLINE_URL = '/index.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('CampusAI: Shielding Core Assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is down
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // If the main document fails, return index.html
          if (event.request.mode === 'navigate') {
             return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Broadcast Push Logic
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { 
    title: 'CampusAI Alert', 
    body: 'New intelligence available for your admission track.' 
  };

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232563eb%22/><path d=%22M25 40 L50 20 L75 40 L50 60 Z%22 fill=%22white%22/><path d=%22M35 45 L35 65 C35 65 50 72 65 65 L65 45%22 fill=%22none%22 stroke=%22white%22 stroke-width=%225%22/></svg>',
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232563eb%22/><path d=%22M25 40 L50 20 L75 40 L50 60 Z%22 fill=%22white%22/><path d=%22M35 45 L35 65 C35 65 50 72 65 65 L65 45%22 fill=%22none%22 stroke=%22white%22 stroke-width=%225%22/></svg>',
    vibrate: [200, 100, 200],
    data: { url: self.location.origin }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});