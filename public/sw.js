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
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url && "focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
