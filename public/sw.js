/* Service worker mínimo: necesario en iOS (PWA) para Web Push / notificaciones del sistema.
   Sin lógica de caché agresiva: la app sigue siendo online-first. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* iOS / Safari: a veces solo muestra notificaciones si las dispara el SW. */
self.addEventListener("message", (event) => {
  const d = event.data;
  if (!d || d.type !== "SHOW_NOTIFICATION" || !d.title) return;
  event.waitUntil(
    self.registration
      .showNotification(d.title, {
        body: d.body,
        icon: d.icon,
        tag: d.tag,
        badge: d.icon,
      })
      .catch(() => {}),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if ("focus" in c) {
          c.focus();
          if ("navigate" in c) {
            try {
              return c.navigate(targetUrl);
            } catch {
              // ignore
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});

// Web Push payload esperado:
// { title, body, icon, badge, tag, url }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : "" };
    } catch {
      data = {};
    }
  }
  const title = data.title || "Renacer";
  const body = data.body || "";
  const icon = data.icon || "/icons/icon-192.png";
  const badge = data.badge || icon;
  const tag = data.tag || "renacer-push";
  const url = data.url || "/";
  event.waitUntil(
    self.registration
      .showNotification(title, {
        body,
        icon,
        badge,
        tag,
        data: { url },
      })
      .catch(() => {}),
  );
});
