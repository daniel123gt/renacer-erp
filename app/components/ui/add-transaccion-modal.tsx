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
  finanzasService,
  type CategoriaFinanza,
  type TransaccionInput,
  type Transaccion,
} from "~/services/finanzasService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "entrada" | "salida";
  onSuccess: () => void;
  editData?: Transaccion | null;
}

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

export function AddTransaccionModal({ open, onOpenChange, tipo, onSuccess, editData }: Props) {
  const [categorias, setCategorias] = useState<CategoriaFinanza[]>([]);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoriaId, setCategoriaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [persona, setPersona] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [notas, setNotas] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      finanzasService.getCategorias().then(setCategorias).catch(() => {});
      if (editData) {
        setFecha(editData.fecha);
        setCategoriaId(editData.categoria_id ?? "");
        setDescripcion(editData.descripcion);
        setMonto(String(editData.monto));
        setPersona(editData.persona ?? "");
        setMetodoPago(editData.metodo_pago ?? "");
        setNotas(editData.notas ?? "");
      } else {
        setFecha(new Date().toISOString().split("T")[0]);
        setCategoriaId("");
        setDescripcion("");
        setMonto("");
        setPersona("");
        setMetodoPago("");
        setNotas("");
      }
    }
  }, [open, editData]);

  const filteredCategorias = categorias.filter((c) => c.tipo === tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const input: TransaccionInput = {
        fecha,
        tipo,
        categoria_id: categoriaId || null,
        descripcion: descripcion.trim(),
        monto: montoNum,
        persona: persona.trim() || undefined,
        metodo_pago: metodoPago || undefined,
        notas: notas.trim() || undefined,
      };

      if (isEditing && editData) {
        await finanzasService.actualizar(editData.id, input);
        toast.success("Transacción actualizada");
      } else {
        await finanzasService.crear(input);
        toast.success(tipo === "entrada" ? "Entrada registrada" : "Salida registrada");
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
          <DialogTitle>
            {isEditing ? "Editar" : "Registrar"}{" "}
            {tipo === "entrada" ? "Entrada" : "Salida"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Monto (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Categoría</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              placeholder={
                tipo === "entrada"
                  ? "Ej: Ofrenda domingo 16"
                  : "Ej: Alquiler domingo 16"
              }
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Persona (opcional)</Label>
              <Input
                placeholder="Nombre"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
              />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={
                tipo === "entrada"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-500 hover:bg-red-600"
              }
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : tipo === "entrada" ? "Registrar entrada" : "Registrar salida"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
