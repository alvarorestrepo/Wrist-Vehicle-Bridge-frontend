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
  if (!event.data) {
    return;
  }

  let payload;

  try {
    payload = event.data.json();
  } catch {
    return;
  }

  if (!isSentryAlertPayload(payload)) {
    return;
  }

  const notificationTitle = payload.title || "Sentry alert";
  const notificationBody = payload.body || "Open Tesla Web to review Sentry status.";

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        data: payload,
        icon: "/icons/bridge-icon-192.png",
        tag: `sentry-${payload.vin}`,
      }),
      broadcastSentryAlert(payload),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notificationData = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const visibleClient = clientList.find((client) => "focus" in client);

      if (visibleClient) {
        if (isSentryAlertPayload(notificationData)) {
          visibleClient.postMessage(notificationData);
        }

        return visibleClient.focus();
      }

      return self.clients.openWindow(isSentryAlertPayload(notificationData) ? "/?sentry_alert=1" : "/");
    }),
  );
});

function isSentryAlertPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      payload.type === "sentry_alert" &&
      typeof payload.vin === "string" &&
      typeof payload.sentryMode === "string" &&
      isSentryAlertSeverity(payload.severity) &&
      typeof payload.observedAt === "string" &&
      typeof payload.title === "string" &&
      typeof payload.body === "string",
  );
}

function isSentryAlertSeverity(severity) {
  return severity === "warning" || severity === "critical";
}

function broadcastSentryAlert(payload) {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage(payload);
    });
  });
}
