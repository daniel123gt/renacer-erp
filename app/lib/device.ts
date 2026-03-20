/** iPhone / iPod / iPad (incl. iPadOS con UA de escritorio). */
export function isLikelyIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS 13+ puede reportarse como Mac con touch
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** App abierta como PWA (añadida a inicio) — condición que Apple exige para muchas APIs de notificación. */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function supportsServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}
