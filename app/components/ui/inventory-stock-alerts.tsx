"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Package } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";

const POLL_MS = 60_000;

function isStockAlert(item: InventoryItem): boolean {
  return item.status === "low_stock" || item.status === "out_of_stock";
}

function sortAlerts(a: InventoryItem, b: InventoryItem): number {
  if (a.status === "out_of_stock" && b.status !== "out_of_stock") return -1;
  if (b.status === "out_of_stock" && a.status !== "out_of_stock") return 1;
  return a.name.localeCompare(b.name, "es");
}

/**
 * Icono junto a la campanita: productos sin stock o con stock bajo.
 * No hay “marcar leído”: el aviso desaparece solo cuando el inventario vuelve a niveles normales.
 */
export function InventoryStockAlerts() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await inventoryService.list();
      setItems(list.filter(isStockAlert).sort(sortAlerts));
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
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const count = items.length;
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
            hasAlerts ? "text-amber-700" : "text-primary-blue/50"
          )}
          aria-label={
            hasAlerts
              ? `Alertas de inventario: ${count} producto(s) con stock bajo o agotado`
              : "Inventario: sin alertas de stock"
          }
        >
          <AlertTriangle className={cn("h-10 w-10", hasAlerts && "text-amber-600")} />
          {hasAlerts && (
            <Badge className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1 flex items-center justify-center rounded-full bg-amber-600 text-[11px] text-white hover:bg-amber-600 border-0">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="end" sideOffset={8}>
        <div className="border-b border-amber-100 bg-amber-50/80 px-3 py-2">
          <span className="text-sm font-semibold text-amber-950">Alertas de inventario</span>
          <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
            Sin stock o por debajo del mínimo. No se archivan: desaparecen al reponer o ajustar el
            producto.
          </p>
        </div>

        <div className="max-h-[min(70vh,360px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : !hasAlerts ? (
            <div className="px-3 py-8 text-center space-y-2">
              <Package className="h-10 w-10 mx-auto text-emerald-500/80" />
              <p className="text-sm text-gray-600">No hay productos con stock bajo ni agotados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((p) => {
                const agotado = p.status === "out_of_stock";
                return (
                  <li key={p.id} className="px-3 py-2.5">
                    <div className="flex gap-2 items-start">
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          agotado ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                        )}
                      >
                        <Package className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {agotado ? (
                            <span className="text-red-700 font-medium">Sin stock</span>
                          ) : (
                            <>
                              Stock bajo: <strong>{p.currentStock}</strong> unidades
                              {p.minStock > 0 && (
                                <>
                                  {" "}
                                  (mín. {p.minStock})
                                </>
                              )}
                            </>
                          )}
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
          <Button variant="outline" size="sm" className="w-full border-amber-200 text-amber-900" asChild>
            <Link to="/renashop/inventario" onClick={() => setOpen(false)}>
              Ir a inventario Renashop
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
