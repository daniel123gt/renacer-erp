"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { finanzasService, type Transaccion } from "~/services/finanzasService";

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "plin", label: "Plin" },
  { value: "transferencia", label: "Transferencia" },
  { value: "otro", label: "Otro" },
];

function cleanCompraNotas(raw: string | null): string {
  const text = String(raw ?? "");
  return text
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !s.toLowerCase().startsWith("renashop_compra:"))
    .join(" | ");
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Transaccion | null;
};

export function AddRenashopCompraModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("otro");
  const [notas, setNotas] = useState("");
  const isEditing = !!editData;

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setFecha(editData.fecha);
      setDescripcion(editData.descripcion);
      setMonto(String(editData.monto));
      setMetodoPago(editData.metodo_pago ?? "otro");
      setNotas(cleanCompraNotas(editData.notas));
      return;
    }
    setFecha(new Date().toISOString().split("T")[0]);
    setDescripcion("");
    setMonto("");
    setMetodoPago("otro");
    setNotas("");
  }, [open, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!descripcion.trim()) return toast.error("La descripción es obligatoria");
    if (!Number.isFinite(montoNum) || montoNum <= 0) return toast.error("Monto inválido");

    setLoading(true);
    try {
      if (isEditing && editData) {
        await finanzasService.actualizarSalidaRenashop(editData.id, {
          fecha,
          descripcion: descripcion.trim(),
          monto: montoNum,
          metodo_pago: metodoPago || undefined,
          notas: notas.trim() || undefined,
        });
        toast.success("Compra actualizada");
      } else {
        await finanzasService.crearSalidaRenashop({
          fecha,
          descripcion: descripcion.trim(),
          monto: montoNum,
          metodo_pago: metodoPago || undefined,
          notas: notas.trim() || undefined,
        });
        toast.success("Compra registrada");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar compra" : "Registrar compra"} Renashop</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
              <Label>Monto (S/)</Label>
              <Input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              placeholder="Ej: Compra de bebidas varias"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Método de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
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

          <div>
            <Label>Notas (opcional)</Label>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas adicionales" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-red-500 hover:bg-red-600" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? "Guardar cambios" : "Registrar compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
