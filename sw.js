// ============================================================
// Service Worker - يلا كيمياء
// ============================================================

const CACHE_NAME = 'yalla-kimya-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Lalezar&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js'
];

// تثبيت الـ Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🔧 تم فتح التخزين المؤقت');
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
            console.log('🗑️ حذف التخزين المؤقت القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
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
      .catch(() => {
        // صفحة أوفلاين
        return caches.match('/offline.html');
      })
  );
});

// إشعارات الدفع (اختياري)
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg',
    badge: 'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
