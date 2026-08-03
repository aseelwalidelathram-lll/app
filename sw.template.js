/*
 * Lumen's service worker.
 *
 * This file is a template. The build fills in the placeholders below with the
 * real base path and the real list of fingerprinted assets, then emits the
 * result as dist/sw.js. Editing it by hand is fine — just don't hardcode any
 * asset filenames, they change on every build.
 *
 * The save file lives in localStorage, so the only thing worth caching is the
 * app shell itself:
 *
 *   install     → precache the whole shell, so the very first visit is enough
 *                 to make the app work offline forever after
 *   navigation  → network first, falling back to the cached shell with no
 *                 signal; this is what lets a new deploy land on next launch
 *   everything  → cache first, since Vite fingerprints these filenames and a
 *   else          cached hit is therefore always the right one
 */

const VERSION = '__VERSION__';
const CACHE = `lumen-${VERSION}`;
const BASE = '__BASE__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 can't sink the whole install.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(BASE, copy));
          return res;
        })
        .catch(async () => (await caches.match(BASE)) ?? Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
