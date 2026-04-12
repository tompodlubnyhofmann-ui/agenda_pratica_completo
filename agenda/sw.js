// Agenda Prática - Service Worker v1
const CACHE_NAME = 'agenda-pratica-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // If some assets fail (like icons not existing yet), continue anyway
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH (offline support) ───────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// ── PUSH NOTIFICATIONS (Firebase FCM) ────────────────────
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { notification: { title: 'Agenda Prática', body: event.data ? event.data.text() : 'Novo lembrete' } };
  }

  const notification = data.notification || {};
  const title = notification.title || 'Agenda Prática';
  const options = {
    body: notification.body || 'Você tem um evento próximo',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Abrir agenda' },
      { action: 'dismiss', title: 'Dispensar' }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});

// ── BACKGROUND SYNC (for future use) ─────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-events') {
    // Future: sync events with cloud backend
    console.log('[SW] Background sync triggered');
  }
});
