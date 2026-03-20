import { getFaviconPath } from "~/lib/erpBranding";

/**
 * Muestra una notificación del sistema.
 * - Windows / Chrome: suele bastar con `new Notification` o `registration.showNotification`.
 * - iPhone/iPad (PWA en inicio): WebKit suele exigir la ruta vía Service Worker (`showNotification` en el SW);
 *   los iconos deben ser URL absolutas.
 */
export async function showOsNotification(
  title: string,
  options: { body?: string; tag?: string },
): Promise<void> {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const iconPath = getFaviconPath();
  const icon = iconPath.startsWith("http")
    ? iconPath
    : new URL(iconPath, window.location.origin).href;

  const payload = {
    body: options.body,
    tag: options.tag,
    icon,
    badge: icon,
  };

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      try {
        await reg.showNotification(title, payload);
        return;
      } catch {
        /* p. ej. iOS: probar desde el SW con mensaje */
      }
      if (reg.active) {
        reg.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body: payload.body,
          icon: payload.icon,
          tag: payload.tag,
        });
        return;
      }
    } catch {
      /* sin SW */
    }
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, payload);
  } catch {
    /* ignorar */
  }
}
