// Incrementar CACHE_NAME en cada deploy para invalidar el cache anterior
const CACHE_NAME = 'educhat-v3';

// Instalación: activar de inmediato para que el nuevo bundle tome efecto sin esperar
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
  self.skipWaiting();
});

// Activación: limpiar caches de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para API y navegación HTML, cache-first para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API: siempre network, sin cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('{"ok":false,"error":"Sin conexión"}', {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Navegación HTML (tipear URL, F5, links externos): siempre network-first.
  // Así el índice siempre trae el JS actualizado y los guards funcionan.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match('/').then((r) => r || fetch('/')))
    );
    return;
  }

  // Assets estáticos con hash en el nombre (JS, CSS, imágenes): cache-first.
  // Los hashes garantizan que si el contenido cambia, el nombre cambia.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match('/'));
    })
  );
});

// Mensaje desde el cliente: activar el nuevo SW inmediatamente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

// Click en notificación push
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
