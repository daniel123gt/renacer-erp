import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const VERSION_URL = "/version.json";

export function VersionUpdateBanner() {
  const toastShownRef = useRef(false);

  const checkVersion = useCallback(async () => {
    if (import.meta.env.DEV) return;
    const currentVersion =
      (typeof import.meta !== "undefined" && (import.meta.env?.VITE_APP_VERSION as string)) || "";
    try {
      const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const deployedVersion = data?.version;
      if (
        deployedVersion &&
        currentVersion &&
        String(deployedVersion).trim() !== String(currentVersion).trim()
      ) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.info("Hay una nueva versión disponible", {
            description: "Recarga la página para ver los últimos cambios.",
            duration: Infinity,
            action: {
              label: "Recargar",
              onClick: () => window.location.reload(),
            },
          });
        }
      }
    } catch {
      // Ignorar errores de red
    }
  }, []);

  useEffect(() => {
    // Pequeña demora para no competir con la carga inicial
    const initial = setTimeout(checkVersion, 2000);
    const id = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    const onFocus = () => checkVersion();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkVersion]);
  return null;
}
