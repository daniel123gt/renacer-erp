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
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  actividadesService,
  type Actividad,
  type ActividadInput,
  type EstadoActividad,
  sumarCostoInsumos,
} from "~/services/actividadesService";
import { cn } from "~/lib/utils";

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

type InsumoRow = { rowId: string; nombre: string; costo: string };

function rowsFromActividad(editData: Actividad): InsumoRow[] {
  if (editData.insumos.length > 0) {
    return editData.insumos.map((i) => ({
      rowId: crypto.randomUUID(),
      nombre: i.nombre,
      costo: String(i.costo),
    }));
  }
  if (editData.costo_total > 0) {
    return [
      {
        rowId: crypto.randomUUID(),
        nombre: "Costo total previo (divide o renombra)",
        costo: String(editData.costo_total),
      },
    ];
  }
  return [];
}

function buildInsumosPayload(rows: InsumoRow[]) {
  return rows
    .map((r) => ({
      nombre: r.nombre.trim(),
      costo: parseFloat(r.costo.replace(",", ".")) || 0,
    }))
    .filter((i) => i.nombre.length > 0 && i.costo > 0);
}

export function AddActividadModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Pollada");
  const [proposito, setProposito] = useState("");
  const [metaCantidad, setMetaCantidad] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [insumoRows, setInsumoRows] = useState<InsumoRow[]>([]);
  const [nuevoInsumoNombre, setNuevoInsumoNombre] = useState("");
  const [nuevoInsumoCosto, setNuevoInsumoCosto] = useState("");
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
        setInsumoRows(rowsFromActividad(editData));
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
        setInsumoRows([]);
        setFechaInicio("");
        setFechaFin("");
        setEstado("pendiente");
        setNotas("");
      }
      setNuevoInsumoNombre("");
      setNuevoInsumoCosto("");
    }
  }, [open, editData]);

  const insumosPayloadPreview = useMemo(() => buildInsumosPayload(insumoRows), [insumoRows]);
  const costoTotalInsumos = useMemo(() => sumarCostoInsumos(insumosPayloadPreview), [insumosPayloadPreview]);

  const metaRecaudacion = (Number(metaCantidad) || 0) * (Number(precioUnitario) || 0);

  const agregarInsumo = () => {
    const n = nuevoInsumoNombre.trim();
    const c = parseFloat(nuevoInsumoCosto.replace(",", ".")) || 0;
    if (!n) {
      toast.error("Indica el nombre del insumo");
      return;
    }
    if (c <= 0) {
      toast.error("El costo debe ser mayor a 0");
      return;
    }
    setInsumoRows((prev) => [
      ...prev,
      { rowId: crypto.randomUUID(), nombre: n, costo: String(c) },
    ]);
    setNuevoInsumoNombre("");
    setNuevoInsumoCosto("");
  };

  const quitarInsumo = (rowId: string) => {
    setInsumoRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const actualizarFila = (rowId: string, patch: Partial<Pick<InsumoRow, "nombre" | "costo">>) => {
    setInsumoRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const meta = parseInt(metaCantidad);
    if (isNaN(meta) || meta <= 0) {
      toast.error("La meta debe ser mayor a 0");
      return;
    }
    const precio = parseFloat(precioUnitario);
    if (isNaN(precio) || precio <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    const insumos = buildInsumosPayload(insumoRows);

    setLoading(true);
    try {
      const input: ActividadInput = {
        nombre: nombre.trim(),
        tipo,
        proposito: proposito.trim() || null,
        meta_cantidad: meta,
        precio_unitario: precio,
        insumos,
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
      <DialogContent
        className={cn(
          "w-[95vw] max-w-[95vw] max-h-[92vh] overflow-y-auto sm:max-w-[min(96vw,720px)]",
          "top-[50%] translate-y-[-50%] p-4 sm:p-6"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Editar actividad" : "Nueva actividad"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Pollada pro alquiler"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Propósito</Label>
            <Input
              placeholder="Ej: Recaudar fondos para el alquiler del local"
              value={proposito}
              onChange={(e) => setProposito(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Meta (cantidad) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ej: 100"
                value={metaCantidad}
                onChange={(e) => setMetaCantidad(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Precio unitario (S/) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 15.00"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <Label className="text-amber-900">Costo de insumos</Label>
            <p className="text-xs text-muted-foreground">
              Añade cada insumo con su costo; el total se suma solo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full space-y-1">
                <Label className="text-xs text-muted-foreground">Nombre del insumo</Label>
                <Input
                  placeholder="Ej: Pollo, carbón, bebidas…"
                  value={nuevoInsumoNombre}
                  onChange={(e) => setNuevoInsumoNombre(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-36 space-y-1">
                <Label className="text-xs text-muted-foreground">Costo (S/)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={nuevoInsumoCosto}
                  onChange={(e) => setNuevoInsumoCosto(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" className="w-full sm:w-auto shrink-0" onClick={agregarInsumo}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {insumoRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md bg-white/60">
                Aún no hay insumos. El costo total será S/ 0.00
              </p>
            ) : (
              <ul className="space-y-2 max-h-[min(36vh,280px)] overflow-y-auto">
                {insumoRows.map((row) => (
                  <li
                    key={row.rowId}
                    className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white rounded-md border p-2"
                  >
                    <Input
                      className="flex-1"
                      value={row.nombre}
                      onChange={(e) => actualizarFila(row.rowId, { nombre: e.target.value })}
                    />
                    <div className="flex gap-2 items-center shrink-0">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-28 text-right"
                        value={row.costo}
                        onChange={(e) => actualizarFila(row.rowId, { costo: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 shrink-0"
                        onClick={() => quitarInsumo(row.rowId)}
                        aria-label="Quitar insumo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-amber-200/80">
              <span className="font-semibold text-amber-900">Costo total de insumos</span>
              <span className="text-lg font-bold text-amber-800 tabular-nums">
                S/{" "}
                {costoTotalInsumos.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {metaRecaudacion > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-amber-800">
                Meta de recaudación:{" "}
                <strong>
                  S/{" "}
                  {metaRecaudacion.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </p>
              {costoTotalInsumos > 0 && (
                <p className="text-green-700">
                  Ganancia esperada:{" "}
                  <strong>
                    S/{" "}
                    {(metaRecaudacion - costoTotalInsumos).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Input placeholder="Observaciones" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
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
