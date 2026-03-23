import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Combobox } from "~/components/ui/combobox";
import { toast } from "sonner";
import { Loader2, Minus, Plus, Trash2, Package } from "lucide-react";
import {
  ventasRenashopService,
  type VentaRenashop,
  type EstadoPagoVenta,
} from "~/services/ventasRenashopService";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";
import { cn } from "~/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: VentaRenashop | null;
}

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

const ESTADOS_PAGO: { value: EstadoPagoVenta; label: string }[] = [
  { value: "pagado", label: "Pagado" },
  { value: "pendiente", label: "Pendiente de pago" },
];

type CartLine = {
  lineId: string;
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  imageUrl?: string;
};

function newLineFromProduct(p: InventoryItem): CartLine {
  return {
    lineId: crypto.randomUUID(),
    producto_id: p.id,
    producto_nombre: p.name,
    cantidad: 1,
    costo_unitario: p.price,
    precio_unitario: p.salePrice,
    imageUrl: p.imageUrl,
  };
}

export function AddVentaModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [productos, setProductos] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago] = useState("plin");
  const [estadoPago, setEstadoPago] = useState<EstadoPagoVenta>("pagado");
  const [notas, setNotas] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerValue, setPickerValue] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      inventoryService.list().then(setProductos).catch(() => {});
      if (editData) {
        setFecha(editData.fecha);
        setMetodoPago(editData.metodo_pago ?? "plin");
        setEstadoPago(editData.estado_pago === "pendiente" ? "pendiente" : "pagado");
        setNotas(editData.notas ?? "");
        setCart(
          (editData.lineas ?? []).map((l) => ({
            lineId: l.id,
            producto_id: l.producto_id,
            producto_nombre: l.producto_nombre,
            cantidad: l.cantidad,
            costo_unitario: l.costo_unitario,
            precio_unitario: l.precio_unitario,
            imageUrl: undefined,
          }))
        );
      } else {
        setFecha(new Date().toISOString().split("T")[0]);
        setMetodoPago("plin");
        setEstadoPago("pagado");
        setNotas("");
        setCart([]);
      }
      setPickerValue("");
    }
  }, [open, editData]);

  useEffect(() => {
    if (!open || productos.length === 0) return;
    setCart((prev) =>
      prev.map((line) => {
        if (!line.producto_id || line.imageUrl) return line;
        const p = productos.find((x) => x.id === line.producto_id);
        return p?.imageUrl ? { ...line, imageUrl: p.imageUrl } : line;
      })
    );
  }, [open, productos, editData?.id]);

  const comboboxOptions = useMemo(
    () =>
      productos.map((p) => ({
        value: p.id,
        label: `${p.name} — S/ ${p.salePrice.toFixed(2)} (${p.currentStock} disp.)`,
        imageUrl: p.imageUrl,
      })),
    [productos]
  );

  const handlePickerChange = (value: string) => {
    setPickerValue("");
    const prod = productos.find((p) => p.id === value);
    if (!prod) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.producto_id === prod.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, newLineFromProduct(prod)];
    });
    toast.success(`${prod.name} añadido`);
  };

  const updateLine = (lineId: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  };

  const bumpQty = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l;
        const next = Math.max(1, l.cantidad + delta);
        return { ...l, cantidad: next };
      })
    );
  };

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const totalCarrito = useMemo(
    () => cart.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0),
    [cart]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Añade al menos un producto");
      return;
    }
    for (const line of cart) {
      if (!line.producto_nombre.trim()) {
        toast.error("Hay una línea sin nombre de producto");
        return;
      }
      if (line.precio_unitario <= 0) {
        toast.error(`Precio inválido en: ${line.producto_nombre}`);
        return;
      }
      if (line.cantidad < 1) {
        toast.error("La cantidad debe ser al menos 1");
        return;
      }
    }
    if (!isEditing) {
      for (const line of cart) {
        if (!line.producto_id) {
          toast.error("Solo se pueden registrar productos del inventario");
          return;
        }
      }
    }

    const lineasPayload = cart.map((l) => ({
      producto_id: l.producto_id,
      producto_nombre: l.producto_nombre.trim(),
      cantidad: l.cantidad,
      costo_unitario: l.costo_unitario,
      precio_unitario: l.precio_unitario,
    }));
    const cabecera = {
      fecha,
      metodo_pago: metodoPago || "plin",
      estado_pago: estadoPago,
      notas: notas.trim() || undefined,
    };

    setLoading(true);
    try {
      if (isEditing && editData) {
        await ventasRenashopService.actualizarVenta(editData.id, cabecera, lineasPayload);
        toast.success("Venta actualizada");
      } else {
        await ventasRenashopService.crearVenta(lineasPayload, cabecera);
        toast.success("Venta registrada");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-[95vw] max-h-[92vh] overflow-y-auto sm:max-w-[min(96vw,720px)]",
          "top-[50%] translate-y-[-50%] p-4 sm:p-6",
          /* Móvil: modal a pantalla completa */
          "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-full",
          "max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
          /*
            Móvil: el Dialog base usa `display: grid` + altura fija; el espacio sobrante puede
            repartirse entre filas (align-content) y deja un hueco enorme bajo el título.
            Forzamos columna flex pegada arriba (justify-start) y sin gap.
          */
          "max-sm:!flex max-sm:flex-col max-sm:items-stretch max-sm:justify-start max-sm:content-start max-sm:!gap-0 max-sm:p-3 max-sm:pt-3 max-sm:pb-4"
        )}
      >
        <DialogHeader className="max-sm:shrink-0 max-sm:space-y-0 max-sm:p-0 max-sm:mx-0 max-sm:mt-0 max-sm:text-left max-sm:mb-5">
          <DialogTitle className="text-xl max-sm:text-lg max-sm:leading-tight max-sm:pr-10 max-sm:!mb-0 max-sm:!mt-0">
            {isEditing ? "Editar venta" : "Registrar venta"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="min-h-0 space-y-4 max-sm:mt-0 max-sm:flex-1 max-sm:space-y-3 max-sm:overflow-y-auto"
        >
          {/*
            Móvil: Fecha | Método de pago en la misma fila; Estado del pago ancho completo debajo.
            sm+: tres columnas como antes.
          */}
          <div className="grid grid-cols-2 gap-2 min-w-0 sm:grid-cols-3 sm:gap-3">
            <div className="min-w-0">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="max-sm:min-w-0"
              />
            </div>
            <div className="min-w-0">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="max-sm:min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <Label>Estado del pago</Label>
              <Select
                value={estadoPago}
                onValueChange={(v) => setEstadoPago(v as EstadoPagoVenta)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_PAGO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Buscar y añadir producto</Label>
            <Combobox
              key={`picker-${open}-${editData?.id ?? "n"}`}
              value={pickerValue}
              onValueChange={handlePickerChange}
              placeholder="Buscar producto del inventario…"
              emptySearchText="No se encontró el producto"
              options={comboboxOptions}
            />
          </div>

          <div>
            <Label className="mb-2 block">
              {isEditing ? "Producto" : "Carrito"} ({cart.length})
            </Label>
            {cart.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center text-sm text-muted-foreground">
                Busca en el inventario y añade productos al carrito
              </div>
            ) : (
              <ul className="space-y-2 max-h-[min(40vh,320px)] max-sm:max-h-[min(52vh,420px)] overflow-y-auto pr-1">
                {cart.map((line) => {
                  const sub = line.cantidad * line.precio_unitario;
                  return (
                    <li
                      key={line.lineId}
                      className="flex gap-3 items-center rounded-lg border bg-white p-2 shadow-sm"
                    >
                      <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center border">
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-7 w-7 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        {isEditing && !line.producto_id ? (
                          <Input
                            className="h-8 text-sm font-medium"
                            value={line.producto_nombre}
                            onChange={(e) =>
                              updateLine(line.lineId, { producto_nombre: e.target.value })
                            }
                            required
                          />
                        ) : (
                          <p className="font-medium text-sm truncate">{line.producto_nombre}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              disabled={line.cantidad <= 1}
                              onClick={() => bumpQty(line.lineId, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold tabular-nums">
                              {line.cantidad}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => bumpQty(line.lineId, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>P. unit.</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-8 w-24 text-right"
                              value={line.precio_unitario}
                              onChange={(e) =>
                                updateLine(line.lineId, {
                                  precio_unitario: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <p className="font-semibold text-amber-700 tabular-nums">
                          S/ {sub.toFixed(2)}
                        </p>
                        {(!isEditing || cart.length > 1) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => removeLine(line.lineId)}
                            aria-label="Quitar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="flex justify-between items-center rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="font-semibold text-amber-900">Total</span>
              <span className="text-xl font-bold text-amber-800 tabular-nums">
                S/ {totalCarrito.toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Notas adicionales"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Registrar venta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
