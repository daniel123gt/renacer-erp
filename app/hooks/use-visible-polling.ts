import { useEffect, useRef } from "react";

/** Intervalo por defecto para alertas de cabecera (5 min). */
export const HEADER_POLL_MS = 5 * 60_000;

/** Al volver a la pestaña no se repite la consulta si la última fue hace menos de esto. */
const MIN_REFRESH_GAP_MS = 30_000;

/**
 * Ejecuta `refresh` al montar y luego cada `intervalMs`, pero solo mientras la pestaña
 * está visible. En segundo plano (PWA abierta, pestaña oculta) no consulta la BD;
 * al volver a primer plano refresca una vez y reanuda el intervalo.
 */
export function useVisiblePolling(refresh: () => void | Promise<void>, intervalMs = HEADER_POLL_MS) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: number | undefined;
    let lastRun = 0;

    const run = () => {
      lastRun = Date.now();
      void refreshRef.current();
    };

    const start = () => {
      if (timer === undefined) timer = window.setInterval(run, intervalMs);
    };

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastRun >= MIN_REFRESH_GAP_MS) run();
        start();
      } else {
        stop();
      }
    };

    run();
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
