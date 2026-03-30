"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  ventasRenashopService,
  type VentaRenashop,
  totalVenta,
} from "~/services/ventasRenashopService";

const POLL_MS = 60_000;

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Icono junto a inventario: ventas Renashop con pago pendiente (aparece en cuanto hay alguna).
 * Desaparece al marcar la venta como pagada.
 */
export function RenashopPendingVentasAlerts() {
  const [open, setOpen] = useState(false);
  const [ventas, setVentas] = useState<VentaRenashop[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await ventasRenashopService.listPendientesCobro();
      setVentas(list);
    } catch {
      setVentas([]);
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
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const count = ventas.length;
  const hasAlerts = count > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative shrink-0 h-[60px] w-[60px] hover:bg-primary-blue/10",
            hasAlerts ? "text-orange-800" : "text-primary-blue/50"
          )}
          aria-label={
            hasAlerts
              ? `Cobros pendientes: ${count} venta(s) con pago pendiente`
              : "Renashop: sin ventas con pago pendiente"
          }
        >
          <Banknote className={cn("h-10 w-10", hasAlerts && "text-orange-600")} />
          {hasAlerts && (
            <Badge className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1 flex items-center justify-center rounded-full bg-orange-600 text-[11px] text-white hover:bg-orange-600 border-0">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="end" sideOffset={8}>
        <div className="border-b border-orange-100 bg-orange-50/80 px-3 py-2">
          <span className="text-sm font-semibold text-orange-950">Pagos pendientes (Renashop)</span>
          <p className="text-[11px] text-orange-900/80 mt-0.5 leading-snug">
            Ventas con cobro pendiente. El aviso desaparece al registrar el pago.
          </p>
        </div>

        <div className="max-h-[min(70vh,360px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : !hasAlerts ? (
            <div className="px-3 py-8 text-center space-y-2">
              <Banknote className="h-10 w-10 mx-auto text-emerald-500/80" />
              <p className="text-sm text-gray-600">No hay ventas con pago pendiente.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {ventas.map((v) => {
                const t = totalVenta(v);
                const created = new Date(v.created_at);
                const dist = formatDistanceToNow(created, { addSuffix: true, locale: es });
                return (
                  <li key={v.id} className="px-3 py-2.5">
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-800">
                        <Banknote className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {v.fecha}
                          {v.nombre?.trim() ? (
                            <span className="text-gray-600 font-normal"> · {v.nombre.trim()}</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Total <strong className="text-orange-800">S/ {formatMoney(t)}</strong>
                          <span className="text-gray-500"> · Registrada {dist}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 p-2">
          <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-900" asChild>
            <Link to="/renashop/ventas" onClick={() => setOpen(false)}>
              Ir a ventas Renashop
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
