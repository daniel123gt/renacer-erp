/* Service worker mínimo: necesario en iOS (PWA) para Web Push / notificaciones del sistema.
   Sin lógica de caché agresiva: la app sigue siendo online-first. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
