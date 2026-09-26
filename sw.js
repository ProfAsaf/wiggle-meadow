/* Wiggle Meadow — offline service worker.
   Precaches the whole game on the first online visit so the Home Screen app works with no network.
   Stale-while-revalidate: files load instantly from the cache while a fresh copy is fetched in the
   background, so a new version shows up on the next launch without bumping anything by hand. */
const CACHE = 'wiggle-meadow';
const CORE = [
  './', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './js/core.js', './js/audio.js', './js/backdrop.js', './js/critters.js', './js/hero.js', './js/sky.js', './js/garden.js', './js/home.js',
  './js/playground.js', './js/beach.js', './js/skyzone.js', './js/underground.js', './js/caves.js',
  './js/blocks.js', './js/dressup.js', './js/kitchen.js', './js/snap.js', './js/save.js', './js/main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req)
      .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    if (cached) { event.waitUntil(fresh); return cached; }
    const res = await fresh;
    if (res) return res;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html', { ignoreSearch: true });
      if (shell) return shell;
    }
    return Response.error();
  })());
});
