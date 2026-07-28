// 网络优先策略 v2 - 总是获取最新版本，离线时回退缓存
const CACHE_NAME = 'fit-track-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(e.request).then(response => {
        if (e.request.method === 'GET') {
          cache.put(e.request, response.clone());
        }
        return response;
      }).catch(() => caches.match(e.request));
    })
  );
});
