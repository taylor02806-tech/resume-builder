const CACHE_NAME = 'resume-builder-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/manifest.json',
  '/static/icons/icon.svg',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

// Service Worker 설치 (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker 활성화 (Activate) - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 가로채기 (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // POST 요청이나 AI 생성 API 요청은 캐시하지 않고 항상 네트워크로 직접 요청
  if (event.request.method !== 'GET' || url.pathname.startsWith('/generate')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 캐시에 있으면 캐시 반환, 없으면 네트워크 요청 후 응답 반환
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // 유효한 응답인 경우 캐시에 추가 (단, 200 응답만)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // 오프라인 상태에서 페이지 요청 실패 시 루트 캐시 반환
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
