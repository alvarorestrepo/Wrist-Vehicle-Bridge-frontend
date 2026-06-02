const CACHE_VERSION = "pwa-static-v1";
const STATIC_CACHE = CACHE_VERSION;

const CACHEABLE_PATH_PREFIXES = ["/_next/static/", "/icons/"];
const NETWORK_ONLY_PATH_PREFIXES = ["/api/", "/api/auth/", "/api/vehicle/", "/api/push/", "/dashboard"];

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isCacheableStaticAsset(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  if (!isSameOrigin(url)) {
    return false;
  }

  if (NETWORK_ONLY_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return false;
  }

  if (request.mode === "navigate") {
    return false;
  }

  return CACHEABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isCacheableStaticAsset(event.request)) {
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(event.request);

      if (networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
      }

      return networkResponse;
    }),
  );
});

self.addEventListener("push", (event) => {
  const fallbackPayload = {
    body: "Open Tesla Web for the latest vehicle bridge update.",
    title: "Tesla Web",
  };

  let payload = fallbackPayload;

  if (event.data) {
    try {
      const parsedPayload = event.data.json();

      payload = {
        body: typeof parsedPayload.body === "string" ? parsedPayload.body : fallbackPayload.body,
        title: typeof parsedPayload.title === "string" ? parsedPayload.title : fallbackPayload.title,
      };
    } catch {
      payload = {
        body: event.data.text() || fallbackPayload.body,
        title: fallbackPayload.title,
      };
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/bridge-icon-192.png",
      tag: "tesla-web-push",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const visibleClient = clientList.find((client) => "focus" in client);

      if (visibleClient) {
        return visibleClient.focus();
      }

      return self.clients.openWindow("/");
    }),
  );
});
