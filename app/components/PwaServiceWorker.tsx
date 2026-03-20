"use client";

import { useEffect } from "react";

/**
 * Registra el SW en /sw.js (solo en cliente, HTTPS o localhost).
 * En iOS, la PWA instalada necesita SW para poder usar notificaciones del sistema (Web Push).
 */
export function PwaServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Sin SW la PWA puede instalarse en algunos casos, pero push iOS no funcionará.
      }
    };
    void register();
  }, []);

  return null;
}
