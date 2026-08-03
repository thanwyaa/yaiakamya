const CACHE_NAME = 'yalla-chem-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593596/idraaak/x0xgxrk0kkxxgn73npal.png',
  'https://res.cloudinary.com/dbahe7lxz/image/upload/v1785593692/idraaak/ogvolfsxxnvk24gho8eb.jpg',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Lalezar&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// تثبيت الـ Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('✅ تم فتح الـ Cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        console.error('❌ فشل في التخزين المؤقت:', err);
      })
  );
});

// تفعيل الـ Service Worker وحذف الـ Caches القديمة
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ تم حذف الـ Cache القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// اعتراض الطلبات وتقديمها من الـ Cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // إذا كان موجود في الـ Cache، أرجعه
        if (response) {
          return response;
        }
        
        // وإلا، قم بجلب الطلب من الشبكة
        return fetch(event.request).then(function(networkResponse) {
          // لا نخزن الطلبات التي تفشل أو التي ليست GET
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // نسخ الاستجابة وتخزينها في الـ Cache
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return networkResponse;
        });
      })
      .catch(function() {
        // في حالة عدم وجود اتصال بالإنترنت
        // يمكن إرجاع صفحة Offline هنا
        return new Response('🚫 غير متصل بالإنترنت', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
