// service-worker.js - خدمة التثبيت والتشغيل بدون إنترنت
const CACHE_NAME = 'yalla-kimya-v1';
const urlsToCache = [
  '/',
  '/app.html',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Lalezar&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593596/idraaak/x0xgxrk0kkxxgn73npal.png'
];

// تثبيت الـ Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ تم فتح الكاش');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل الـ Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ تم حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية التحميل: Cache First ثم Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان الملف في الكاش، نرجعه
        if (response) {
          return response;
        }
        // وإلا نحمله من الشبكة
        return fetch(event.request).then(response => {
          // نضيف الملف الجديد للكاش
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
