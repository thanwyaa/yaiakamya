self.addEventListener('install', e => e.waitUntil(caches.open('yalla-v1').then(c => c.addAll(['/'])).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(k => k !== 'yalla-v1').map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
