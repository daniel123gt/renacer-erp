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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  actividadesService,
  type ActividadVenta,
  type ActividadVentaInput,
} from "~/services/actividadesService";
import { PersonaCombobox } from "~/components/ui/persona-combobox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  actividadId: string;
  precioUnitario: number;
  editData?: ActividadVenta | null;
}

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export function AddActividadVentaModal({ open, onOpenChange, onSuccess, actividadId, precioUnitario, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [entregado, setEntregado] = useState("no");
  const [cancelado, setCancelado] = useState("no");
  const [montoPagado, setMontoPagado] = useState("");
  const [notas, setNotas] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      if (editData) {
        setPersona(editData.persona);
        setCantidad(String(editData.cantidad));
        setFecha(editData.fecha);
        setMetodoPago(editData.metodo_pago ?? "efectivo");
        setEntregado(editData.entregado ? "si" : "no");
        setCancelado(editData.cancelado ? "si" : "no");
        setMontoPagado(editData.monto_pagado > 0 ? String(editData.monto_pagado) : "");
        setNotas(editData.notas ?? "");
      } else {
        setPersona("");
        setCantidad("1");
        setFecha(new Date().toISOString().split("T")[0]);
        setMetodoPago("efectivo");
        setEntregado("no");
        setCancelado("no");
        setMontoPagado("");
        setNotas("");
      }
    }
  }, [open, editData]);

  const monto = (Number(cantidad) || 0) * precioUnitario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persona.trim()) { toast.error("La persona es obligatoria"); return; }
    const cant = parseInt(cantidad);
    if (isNaN(cant) || cant <= 0) { toast.error("La cantidad debe ser mayor a 0"); return; }

    setLoading(true);
    try {
      const input: ActividadVentaInput = {
        actividad_id: actividadId,
        persona: persona.trim(),
        cantidad: cant,
        monto: cant * precioUnitario,
        fecha,
        metodo_pago: metodoPago || "efectivo",
        entregado: entregado === "si",
        cancelado: cancelado === "si",
        monto_pagado: cancelado === "si" ? (parseFloat(montoPagado) || (cant * precioUnitario)) : (parseFloat(montoPagado) || 0),
        notas: notas.trim() || null,
      };
      if (isEditing && editData) {
        await actividadesService.actualizarVenta(editData.id, input);
        toast.success("Venta actualizada");
      } else {
        await actividadesService.crearVenta(input);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar venta" : "Registrar venta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Vendedor / Responsable *</Label>
            <PersonaCombobox value={persona} onValueChange={setPersona} placeholder="Buscar persona..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad *</Label>
              <Input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
            </div>
            <div>
              <Label>Monto (S/)</Label>
              <Input value={`S/ ${monto.toFixed(2)}`} disabled className="bg-gray-50 font-semibold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>¿Entregado?</Label>
              <Select value={entregado} onValueChange={setEntregado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>¿Canceló?</Label>
              <Select value={cancelado} onValueChange={(v) => {
                setCancelado(v);
                if (v === "si" && !montoPagado) setMontoPagado(String(monto));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto pagado (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
              />
            </div>
          </div>

          {monto > 0 && (parseFloat(montoPagado) || 0) > 0 && (parseFloat(montoPagado) || 0) < monto && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
              Pendiente: <strong>S/ {(monto - (parseFloat(montoPagado) || 0)).toFixed(2)}</strong>
            </div>
          )}

          <div>
            <Label>Notas</Label>
            <Input placeholder="Opcional" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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
