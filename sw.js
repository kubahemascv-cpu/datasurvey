// SW CS Input Form — Kumasindo
// File statis, permanen di repo. Bikin Android bisa mengenali app ini
// sebagai PWA yang bisa diinstall permanen (bukan sekadar shortcut).

const CACHE = 'cs-form-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png']).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Submit form (POST ke Apps Script) selalu langsung ke internet —
  // Service Worker cuma nangkep request GET, jadi ini otomatis aman,
  // tapi tetap dikecualikan eksplisit buat jaga-jaga.
  if (/script\.google\.com|docs\.google\.com|googleapis\.com/.test(e.request.url)) {
    e.respondWith(fetch(e.request));
    return;
  }

  // File app (HTML/JS/CSS/icon/manifest): cache-first.
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) {
          if (res && res.status === 200) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return r; });
      });
    })
  );
});
