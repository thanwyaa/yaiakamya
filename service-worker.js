const CACHE_NAME = 'yalla-chemistry-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593596/idraaak/x0xgxrk0kkxxgn73npal.png',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
