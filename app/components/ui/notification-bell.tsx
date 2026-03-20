"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Building2, Cake, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  notificacionesService,
  type NotificacionConEstado,
  type TipoNotificacion,
} from "~/services/notificacionesService";

const POLL_MS = 45_000;

function iconForTipo(tipo: TipoNotificacion) {
  if (tipo === "cumpleanos") return Cake;
  return Building2;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificacionConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nativePermission, setNativePermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") return "default";
    return Notification.permission;
  });
  const shownNativeIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const list = await notificacionesService.listar(40);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const unread = items.filter((n) => !n.leida).length;

  const handleOpenItem = async (n: NotificacionConEstado) => {
    if (n.leida) return;
    setBusyId(n.id);
    try {
      await notificacionesService.marcarLeida(n.id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleMarcarTodas = async () => {
    setBusyId("all");
    try {
      await notificacionesService.marcarTodasLeidas();
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const requestNativePermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    try {
      const res = await Notification.requestPermission();
      setNativePermission(res);
    } catch {
      // Si el navegador no soporta la API, simplemente no mostramos notificación nativa
    }
  }, []);

  // Cuando la app está abierta y llega una notificación nueva sin leer,
  // mostramos una notificación nativa del sistema (sin Web Push).
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (nativePermission !== "granted") return;
    const latestUnread = items.find((n) => !n.leida);
    if (!latestUnread) return;
    if (shownNativeIdsRef.current.has(latestUnread.id)) return;

    shownNativeIdsRef.current.add(latestUnread.id);
    try {
      // Se muestra solo una por refresh (la más reciente sin leer)
      // Nota: algunos navegadores requieren HTTPS y permiso concedido.
      // eslint-disable-next-line no-new
      new Notification(latestUnread.titulo, { body: latestUnread.cuerpo });
    } catch {
      // Si no se puede (por políticas del navegador), no rompemos la UI.
    }
  }, [items, nativePermission]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0 text-primary-blue hover:bg-primary-blue/10"
          aria-label="Notificaciones"
        >
          <Bell className="h-6 w-6" />
          {unread > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-pink-600 text-[10px] text-white hover:bg-pink-600 border-0">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
          {unread > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary-blue"
              disabled={busyId === "all"}
              onClick={() => void handleMarcarTodas()}
            >
              Marcar todas leídas
            </Button>
          )}
        </div>

        {nativePermission !== "granted" && (
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-600 mb-2">
              Para ver alertas nativas del sistema, permite notificaciones en tu navegador.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => void requestNativePermission()}
            >
              Activar notificaciones nativas
            </Button>
          </div>
        )}

        <div className="max-h-[min(70vh,360px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary-blue" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 px-4">No hay notificaciones</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => {
                const Icon = iconForTipo(n.tipo);
                const rel = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es });
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex gap-2",
                        !n.leida && "bg-pink-50/60",
                      )}
                      disabled={busyId === n.id}
                      onClick={() => void handleOpenItem(n)}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          n.tipo === "cumpleanos" ? "bg-pink-100 text-pink-700" : "bg-amber-100 text-amber-800",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{n.titulo}</span>
                          {!n.leida && <span className="h-1.5 w-1.5 rounded-full bg-pink-600 shrink-0" />}
                        </span>
                        <span className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.cuerpo}</span>
                        <span className="text-[10px] text-gray-400 mt-1">{rel}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
