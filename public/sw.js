/* Apnacatalog service worker: makes the site installable and lets
   already-visited catalogs open without internet. */
const CACHE = "apnacatalog-v1";
const OFFLINE_URL = "/offline";
const PRIVATE = ["/dashboard", "/admin", "/auth", "/login", "/o/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build files never change for a given name: serve from cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode !== "navigate") return;

  const isPrivate = PRIVATE.some((p) => url.pathname.startsWith(p));
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !isPrivate) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = isPrivate ? undefined : await caches.match(request);
        return cached || (await caches.match(OFFLINE_URL)) || Response.error();
      }),
  );
});
