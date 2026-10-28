/* 光が丘 点検結果確認書 サービスワーカー
   ・HTML：ネットワーク優先→失敗時キャッシュ（更新がすぐ反映され、オフラインでも開ける）
   ・アイコン等：キャッシュ優先→無ければ取得
   ・新しい index.html を上げるときは、下の CACHE 名の末尾と index.html の APP_VER を一緒に上げる
*/
const CACHE = 'hikarigaoka-houkoku-v0_5';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // cache:'reload' でブラウザ自身のキャッシュも迂回する（端末ごとに古い版が残るのを防ぐ）
    e.respondWith(
      fetch(new Request(req.url, { cache: 'reload', credentials: 'same-origin' }))
        .then((resp) => { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return resp; })
        .catch(() => fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))))
    );
  } else {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((resp) => {
        const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return resp;
      }))
    );
  }
});
