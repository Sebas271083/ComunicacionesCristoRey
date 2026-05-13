const CACHE_NAME = 'educhat-v1';
const STATIC_ASSETS = ['/', '/chat', '/tareas', '/calendario', '/perfil'];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para API, cache-first para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API: siempre network, sin cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(request).catch(() => new Response('{"ok":false,"error":"Sin conexión"}', {
      headers: { 'Content-Type': 'application/json' },
    })));
    return;
  }

  // Assets: cache-first con fallback a network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});

// Notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'EduChat', body: 'Nueva notificación' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/chat' },
      vibrate: [200, 100, 200],
    })
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data?.url ?? '/chat';
      const client = clientList.find((c) => c.url.includes(url) && 'focus' in c);
      if (client) return client.focus();
      return clients.openWindow(url);
    })
  );
});
