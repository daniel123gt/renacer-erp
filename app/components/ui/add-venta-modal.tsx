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
import { Loader2, Minus, Plus, Trash2, Package, Banknote, Ellipsis } from "lucide-react";
import {
  ventasRenashopService,
  type VentaRenashop,
  type EstadoPagoVenta,
  type VentaLineaInput,
} from "~/services/ventasRenashopService";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";
import { cn } from "~/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: VentaRenashop | null;
}

const ESTADOS_PAGO: { value: EstadoPagoVenta; label: string }[] = [
  { value: "pagado", label: "Pagado" },
  { value: "pendiente", label: "Pendiente de pago" },
];

/** Métodos permitidos al editar (registro nuevo usa tarjetas: plin | efectivo | otro) */
const METODOS_EDICION = [
  { value: "plin", label: "Plin" },
  { value: "efectivo", label: "Efectivo" },
  { value: "otro", label: "Otro" },
] as const;

type MetodoTarjeta = "plin" | "efectivo" | "otro";

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

function validateCartForSave(cart: CartLine[], isEditing: boolean): boolean {
  if (cart.length === 0) {
    toast.error("Añade al menos un producto");
    return false;
  }
  for (const line of cart) {
    if (!line.producto_nombre.trim()) {
      toast.error("Hay una línea sin nombre de producto");
      return false;
    }
    if (line.precio_unitario <= 0) {
      toast.error(`Precio inválido en: ${line.producto_nombre}`);
      return false;
    }
    if (line.cantidad < 1) {
      toast.error("La cantidad debe ser al menos 1");
      return false;
    }
  }
  if (!isEditing) {
    for (const line of cart) {
      if (!line.producto_id) {
        toast.error("Solo se pueden registrar productos del inventario");
        return false;
      }
    }
  }
  return true;
}

export function AddVentaModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [productos, setProductos] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago] = useState("plin");
  const [estadoPago, setEstadoPago] = useState<EstadoPagoVenta>("pagado");
  const [nombreCliente, setNombreCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerValue, setPickerValue] = useState("");

  const [paymentPickOpen, setPaymentPickOpen] = useState(false);
  const [pickedMetodo, setPickedMetodo] = useState<MetodoTarjeta>("plin");

  const isEditing = !!editData;

  const metodosEdicionItems = useMemo(() => {
    const raw = (editData?.metodo_pago ?? "").trim().toLowerCase();
    const base = [...METODOS_EDICION];
    if (raw && !base.some((m) => m.value === raw)) {
      return [...base, { value: raw, label: `${raw} (actual)` }];
    }
    return base;
  }, [editData?.metodo_pago]);

  useEffect(() => {
    if (open) {
      inventoryService.list().then(setProductos).catch(() => {});
      setPaymentPickOpen(false);
      if (editData) {
        setFecha(editData.fecha);
        const m = (editData.metodo_pago ?? "plin").toLowerCase();
        setMetodoPago(m);
        setEstadoPago(editData.estado_pago === "pendiente" ? "pendiente" : "pagado");
        setNombreCliente(editData.nombre ?? "");
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
        setNombreCliente("");
        setNotas("");
        setCart([]);
        setPickedMetodo("plin");
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

  const nombreRequerido = estadoPago === "pendiente";

  const buildLineasPayload = (): VentaLineaInput[] =>
    cart.map((l) => ({
      producto_id: l.producto_id,
      producto_nombre: l.producto_nombre.trim(),
      cantidad: l.cantidad,
      costo_unitario: l.costo_unitario,
      precio_unitario: l.precio_unitario,
    }));

  const validateNombre = (): boolean => {
    if (nombreRequerido && !nombreCliente.trim()) {
      toast.error("Indica el nombre (obligatorio si el pago está pendiente)");
      return false;
    }
    return true;
  };

  const openPaymentPicker = () => {
    if (!validateCartForSave(cart, false)) return;
    if (!validateNombre()) return;
    setPickedMetodo(estadoPago === "pendiente" ? "otro" : "plin");
    setPaymentPickOpen(true);
  };

  const confirmarNuevaVenta = async () => {
    const lineasPayload = buildLineasPayload();
    const cabecera = {
      fecha,
      metodo_pago: pickedMetodo,
      estado_pago: estadoPago,
      nombre: nombreCliente.trim() || undefined,
      notas: notas.trim() || undefined,
    };
    setLoading(true);
    try {
      await ventasRenashopService.crearVenta(lineasPayload, cabecera);
      toast.success("Venta registrada");
      setPaymentPickOpen(false);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    if (!validateCartForSave(cart, true)) return;
    if (!validateNombre()) return;

    const lineasPayload = buildLineasPayload();
    const cabecera = {
      fecha,
      metodo_pago: metodoPago || "plin",
      estado_pago: estadoPago,
      nombre: nombreCliente.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    setLoading(true);
    try {
      await ventasRenashopService.actualizarVenta(editData.id, cabecera, lineasPayload);
      toast.success("Venta actualizada");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "relative w-[95vw] max-w-[95vw] max-h-[92vh] overflow-y-auto sm:max-w-[min(96vw,720px)]",
          "top-[50%] translate-y-[-50%] p-4 sm:p-6",
          "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-full",
          "max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
          "max-sm:!flex max-sm:flex-col max-sm:items-stretch max-sm:justify-start max-sm:content-start max-sm:!gap-0 max-sm:p-3 max-sm:pt-3 max-sm:pb-4"
        )}
      >
        <DialogHeader className="max-sm:shrink-0 max-sm:space-y-0 max-sm:p-0 max-sm:mx-0 max-sm:mt-0 max-sm:text-left max-sm:mb-5">
          <DialogTitle className="text-xl max-sm:text-lg max-sm:leading-tight max-sm:pr-10 max-sm:!mb-0 max-sm:!mt-0">
            {isEditing ? "Editar venta" : "Registrar venta"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isEditing) void handleSubmitEdit(e);
          }}
          className="min-h-0 space-y-4 max-sm:mt-0 max-sm:flex-1 max-sm:space-y-3 max-sm:overflow-y-auto"
        >
          <div
            className={cn(
              "grid gap-2 min-w-0 sm:gap-3",
              isEditing ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-2"
            )}
          >
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
            {isEditing && (
              <div className="min-w-0">
                <Label>Método de pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger className="max-sm:min-w-0">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosEdicionItems.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="min-w-0">
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
            <Label htmlFor="venta-nombre-cliente">
              Nombre {nombreRequerido ? <span className="text-red-500">*</span> : <span className="text-muted-foreground font-normal">(opcional)</span>}
            </Label>
            <Input
              id="venta-nombre-cliente"
              placeholder={nombreRequerido ? "Quién debe o compró a crédito" : "Ej: nombre del comprador"}
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              required={nombreRequerido}
              className="mt-1"
            />
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
            {isEditing ? (
              <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600"
                onClick={openPaymentPicker}
              >
                Registrar venta
              </Button>
            )}
          </div>
        </form>

        {/* Paso: elegir método de pago (solo venta nueva) */}
        {paymentPickOpen && !isEditing && (
          <div
            className="absolute inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-6 rounded-lg max-sm:rounded-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-pick-title"
          >
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl border p-4 sm:p-5 space-y-4 max-h-[min(90vh,520px)] overflow-y-auto">
              <h3 id="payment-pick-title" className="text-lg font-semibold text-center">
                ¿Cómo se pagó?
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Elige el método. Si el pago está pendiente, &quot;Otro&quot; viene sugerido.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPickedMetodo("plin")}
                  className={cn(
                    "w-full rounded-xl border-2 p-3 text-left transition-all hover:bg-amber-50/80",
                    pickedMetodo === "plin"
                      ? "border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/50"
                      : "border-gray-200"
                  )}
                >
                  <span className="text-sm font-semibold block mb-2">Plin</span>
                  <div className="h-24 w-full rounded-lg overflow-hidden bg-gray-100 border">
                    <img
                      src="/plin.jpg"
                      alt="Plin"
                      className="h-full w-full object-cover object-right"
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPickedMetodo("efectivo")}
                  className={cn(
                    "w-full rounded-xl border-2 p-4 flex items-center gap-4 transition-all hover:bg-emerald-50/80",
                    pickedMetodo === "efectivo"
                      ? "border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/40"
                      : "border-gray-200"
                  )}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Banknote className="h-9 w-9" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-semibold block">Efectivo</span>
                    <span className="text-sm text-muted-foreground">Pago en billetes o monedas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPickedMetodo("otro")}
                  className={cn(
                    "w-full rounded-xl border-2 p-4 flex items-center gap-4 transition-all hover:bg-slate-50",
                    pickedMetodo === "otro"
                      ? "border-slate-600 ring-2 ring-slate-400/40 bg-slate-50"
                      : "border-gray-200"
                  )}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Ellipsis className="h-9 w-9" strokeWidth={2} />
                  </div>
                  <div>
                    <span className="font-semibold block">Otro</span>
                    <span className="text-sm text-muted-foreground">Otro medio</span>
                  </div>
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentPickOpen(false)}
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={loading}
                  onClick={() => void confirmarNuevaVenta()}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar venta
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
