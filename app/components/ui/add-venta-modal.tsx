import { useState, useEffect } from "react";
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
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ventasRenashopService,
  type VentaRenashop,
  type VentaInput,
} from "~/services/ventasRenashopService";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";

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

export function AddVentaModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [productos, setProductos] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [productoId, setProductoId] = useState("");
  const [productoNombre, setProductoNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [notas, setNotas] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      inventoryService.list().then(setProductos).catch(() => {});
      if (editData) {
        setFecha(editData.fecha);
        setProductoId(editData.producto_id ?? "manual");
        setProductoNombre(editData.producto_nombre);
        setCantidad(String(editData.cantidad));
        setCostoUnitario(String(editData.costo_unitario));
        setPrecioUnitario(String(editData.precio_unitario));
        setMetodoPago(editData.metodo_pago ?? "efectivo");
        setNotas(editData.notas ?? "");
      } else {
        setFecha(new Date().toISOString().split("T")[0]);
        setProductoId("");
        setProductoNombre("");
        setCantidad("1");
        setCostoUnitario("");
        setPrecioUnitario("");
        setMetodoPago("efectivo");
        setNotas("");
      }
    }
  }, [open, editData]);

  const handleProductoChange = (value: string) => {
    setProductoId(value);
    if (value === "manual") {
      setProductoNombre("");
      setCostoUnitario("");
      setPrecioUnitario("");
      return;
    }
    const prod = productos.find((p) => p.id === value);
    if (prod) {
      setProductoNombre(prod.name);
      setCostoUnitario(String(prod.price));
      setPrecioUnitario(String(prod.salePrice));
    }
  };

  const cant = Number(cantidad) || 0;
  const costo = Number(costoUnitario) || 0;
  const precio = Number(precioUnitario) || 0;
  const total = cant * precio;
  const gananciaTotal = cant * (precio - costo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoNombre.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const cantVal = parseInt(cantidad);
    if (isNaN(cantVal) || cantVal <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    const precioVal = parseFloat(precioUnitario);
    if (isNaN(precioVal) || precioVal <= 0) {
      toast.error("El precio de venta debe ser mayor a 0");
      return;
    }
    const costoVal = parseFloat(costoUnitario) || 0;

    setLoading(true);
    try {
      const input: VentaInput = {
        fecha,
        producto_id: productoId && productoId !== "manual" ? productoId : null,
        producto_nombre: productoNombre.trim(),
        cantidad: cantVal,
        costo_unitario: costoVal,
        precio_unitario: precioVal,
        metodo_pago: metodoPago || "efectivo",
        notas: notas.trim() || undefined,
      };

      if (isEditing && editData) {
        await ventasRenashopService.actualizar(editData.id, input);
        toast.success("Venta actualizada");
      } else {
        await ventasRenashopService.crear(input);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar venta" : "Registrar venta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Producto</Label>
            <Combobox
              value={productoId}
              onValueChange={handleProductoChange}
              placeholder="Buscar producto..."
              emptySearchText="No se encontró el producto"
              emptyOption={{ value: "manual", label: "✏️ Escribir manualmente" }}
              options={productos.map((p) => ({
                value: p.id,
                label: `${p.name} — S/ ${p.salePrice.toFixed(2)} (${p.currentStock} disp.)`,
                imageUrl: p.imageUrl,
              }))}
            />
          </div>

          {productoId === "manual" && (
            <div>
              <Label>Nombre del producto</Label>
              <Input
                placeholder="Ej: Gaseosa, Galletas..."
                value={productoNombre}
                onChange={(e) => setProductoNombre(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Precio unit. (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Total (S/)</Label>
              <Input
                value={`S/ ${total.toFixed(2)}`}
                disabled
                className="bg-gray-50 font-semibold"
              />
            </div>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Notas adicionales"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
