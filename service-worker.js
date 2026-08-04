const CACHE_NAME = 'yalla-chemistry-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593596/idraaak/x0xgxrk0kkxxgn73npal.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Lalezar&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cached => cached || new Response('⚠️ غير متصل بالإنترنت', { status: 503 }));
      })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
