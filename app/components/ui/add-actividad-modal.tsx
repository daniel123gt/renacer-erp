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
  type Actividad,
  type ActividadInput,
  type EstadoActividad,
} from "~/services/actividadesService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Actividad | null;
}

const TIPOS = ["Pollada", "Parrillada", "Mistura", "Rifa", "Kermés", "Bazar", "Otro"];
const ESTADOS: { value: EstadoActividad; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "activa", label: "Activa" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];

export function AddActividadModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Pollada");
  const [proposito, setProposito] = useState("");
  const [metaCantidad, setMetaCantidad] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState<EstadoActividad>("pendiente");
  const [notas, setNotas] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      if (editData) {
        setNombre(editData.nombre);
        setTipo(editData.tipo);
        setProposito(editData.proposito ?? "");
        setMetaCantidad(String(editData.meta_cantidad));
        setPrecioUnitario(String(editData.precio_unitario));
        setCostoTotal(editData.costo_total > 0 ? String(editData.costo_total) : "");
        setFechaInicio(editData.fecha_inicio ?? "");
        setFechaFin(editData.fecha_fin ?? "");
        setEstado(editData.estado);
        setNotas(editData.notas ?? "");
      } else {
        setNombre("");
        setTipo("Pollada");
        setProposito("");
        setMetaCantidad("");
        setPrecioUnitario("");
        setCostoTotal("");
        setFechaInicio("");
        setFechaFin("");
        setEstado("pendiente");
        setNotas("");
      }
    }
  }, [open, editData]);

  const metaRecaudacion = (Number(metaCantidad) || 0) * (Number(precioUnitario) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    const meta = parseInt(metaCantidad);
    if (isNaN(meta) || meta <= 0) { toast.error("La meta debe ser mayor a 0"); return; }
    const precio = parseFloat(precioUnitario);
    if (isNaN(precio) || precio <= 0) { toast.error("El precio debe ser mayor a 0"); return; }

    setLoading(true);
    try {
      const input: ActividadInput = {
        nombre: nombre.trim(),
        tipo,
        proposito: proposito.trim() || null,
        meta_cantidad: meta,
        precio_unitario: precio,
        costo_total: parseFloat(costoTotal) || 0,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        estado,
        notas: notas.trim() || null,
      };
      if (isEditing && editData) {
        await actividadesService.actualizar(editData.id, input);
        toast.success("Actividad actualizada");
      } else {
        await actividadesService.crear(input);
        toast.success("Actividad creada");
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Pollada pro alquiler" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Propósito</Label>
            <Input placeholder="Ej: Recaudar fondos para el alquiler del local" value={proposito} onChange={(e) => setProposito(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meta (cantidad) *</Label>
              <Input type="number" min="1" placeholder="Ej: 100" value={metaCantidad} onChange={(e) => setMetaCantidad(e.target.value)} required />
            </div>
            <div>
              <Label>Precio unitario (S/) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="Ej: 15.00" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Costo total de insumos (S/)</Label>
            <Input type="number" step="0.01" min="0" placeholder="Ej: 800.00" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} />
          </div>

          {metaRecaudacion > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-amber-800">Meta de recaudación: <strong>S/ {metaRecaudacion.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong></p>
              {(parseFloat(costoTotal) || 0) > 0 && (
                <p className="text-green-700">Ganancia esperada: <strong>S/ {(metaRecaudacion - (parseFloat(costoTotal) || 0)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong></p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoActividad)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Input placeholder="Observaciones" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear actividad"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
