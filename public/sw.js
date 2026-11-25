/* Apnacatalog service worker: makes the site installable and lets
   already-visited catalogs open without internet. */
const CACHE = "apnacatalog-v3";
const IMG_CACHE = "apnacatalog-images-v1";
const IMG_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
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
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE && k !== IMG_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Allow cross-origin image requests (R2) to be intercepted; skip other cross-origin.
  const isCrossOriginImage =
    url.origin !== self.location.origin &&
    /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url.pathname);
  if (url.origin !== self.location.origin && !isCrossOriginImage) return;

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

  // Cache R2 media images and /_next/image (optimized images): cache-first with 7-day expiry.
  const isImage =
    url.pathname.startsWith("/_next/image") ||
    (url.origin !== self.location.origin && /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url.pathname));
  if (isImage) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) {
          const cached = hit.headers.get("sw-cached-at");
          if (!cached || Date.now() - Number(cached) < IMG_MAX_AGE) return hit;
        }
        try {
          const response = await fetch(request);
          if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set("sw-cached-at", String(Date.now()));
            const body = await response.arrayBuffer();
            cache.put(request, new Response(body, { status: response.status, headers }));
            return new Response(body, { status: response.status, headers: response.headers });
          }
          return hit || response;
        } catch {
          return hit || Response.error();
        }
      }),
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

/* Push notifications (new orders, reports). The server sends { title, body, url, tag }. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Apnacatalog", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Apnacatalog", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/dashboard" },
    }),
  );
});

/* Tapping a notification opens its page, reusing an open tab of the site when there is one. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.navigate(url).then((w) => (w || open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
