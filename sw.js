// ============================================================
// Service Worker - يلا كيمياء PWA
// ============================================================
const CACHE_NAME = 'yalla-chemistry-v2';

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Lalezar&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js',
  'https://www.youtube.com/iframe_api'
];

// ============================================================
// INSTALL - تخزين الملفات الأساسية
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ============================================================
// ACTIVATE - تنظيف الكاش القديم
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ============================================================
// FETCH - استراتيجية التخزين وإجابة الطلبات
// ============================================================
self.addEventListener('fetch', event => {
  // التخزين متاح لطلبات GET فقط
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase و Cloudinary و YouTube (تحديث حي عبر الشبكة مباشرة)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('ytimg.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // استراتيجية Stale-While-Revalidate الآمنة بدون تضارب في قراءة الاستجابة (Response Stream)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // التاكد من سلامة الاستجابة وقابليتها للتخزين
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            // عمل النسخة (clone) فور الاستلام مباشرة
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            }).catch(err => console.error('[SW] Cache put error:', err));
          }
          return networkResponse;
        })
        .catch(err => {
          console.warn('[SW] Network fetch failed, falling back to cache/index if available:', err);
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });

      // إرجاع النسخة المخزنة أولاً إن وجدت، وإلا الانتظار لجلبها من الشبكة
      return cachedResponse || fetchPromise;
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
      return new Response('Network error occurred', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  let data = {
    title: 'يلا كيمياء',
    body: 'لديك إشعار جديد!',
    icon: 'https://res.cloudinary.com/d5nyosrm/image/upload/v1786398649/%D9%84%D9%88%D8%AC%D9%88_%D9%83%D9%85%D9%8A%D8%A7.jpg',
    badge: 'https://res.cloudinary.com/d5nyosrm/image/upload/v1786398649/%D9%84%D9%88%D8%AC%D9%88_%D9%83%D9%85%D9%8A%D8%A7.jpg',
    tag: 'notification'
  };

  try {
    if (event.data) {
      data = {
        ...data,
        ...event.data.json()
      };
    }
  } catch (e) {
    console.warn('[SW] Could not parse push data:', e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || 'https://res.cloudinary.com/d5nyosrm/image/upload/v1786398649/%D9%84%D9%88%D8%AC%D9%88_%D9%83%D9%85%D9%8A%D8%A7.jpg',
      badge: data.badge || 'https://res.cloudinary.com/d5nyosrm/image/upload/v1786398649/%D9%84%D9%88%D8%AC%D9%88_%D9%83%D9%85%D9%8A%D8%A7.jpg',
      tag: data.tag || 'notification',
      data: data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    })
  );
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // إذا كان هناك نافذة مفتوحة، نركز عليها
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // وإلا نفتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================
// MESSAGE HANDLING
// ============================================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker initialized successfully');
