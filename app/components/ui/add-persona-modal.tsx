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
import { personasService, type Persona, type PersonaInput } from "~/services/personasService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: Persona | null;
}

const DISTRITOS_LIMA = [
  "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos",
  "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María",
  "La Molina", "La Victoria", "Lima", "Lince", "Los Olivos",
  "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac",
  "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra",
  "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho",
  "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel",
  "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco",
  "Surquillo", "Villa El Salvador", "Villa María del Triunfo", "Callao",
  "Bellavista", "La Perla", "La Punta", "Carmen de la Legua", "Ventanilla",
  "Otro",
];

export function AddPersonaModal({ open, onOpenChange, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [cumpleDia, setCumpleDia] = useState("");
  const [cumpleMes, setCumpleMes] = useState("");
  const [direccion, setDireccion] = useState("");
  const [distrito, setDistrito] = useState("");
  const [bautizado, setBautizado] = useState("no");
  const [activo, setActivo] = useState("si");
  const [notas, setNotas] = useState("");

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      if (editData) {
        setNombre(editData.nombre);
        setContacto(editData.contacto ?? "");
        setCumpleDia(editData.cumple_dia != null ? String(editData.cumple_dia) : "");
        setCumpleMes(editData.cumple_mes != null ? String(editData.cumple_mes) : "");
        setDireccion(editData.direccion ?? "");
        setDistrito(editData.distrito ?? "");
        setBautizado(editData.bautizado ? "si" : "no");
        setActivo(editData.activo ? "si" : "no");
        setNotas(editData.notas ?? "");
      } else {
        setNombre("");
        setContacto("");
        setCumpleDia("");
        setCumpleMes("");
        setDireccion("");
        setDistrito("");
        setBautizado("no");
        setActivo("si");
        setNotas("");
      }
    }
  }, [open, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const input: PersonaInput = {
        nombre: nombre.trim(),
        contacto: contacto.trim() || null,
        cumple_dia: cumpleDia ? parseInt(cumpleDia) : null,
        cumple_mes: cumpleMes ? parseInt(cumpleMes) : null,
        direccion: direccion.trim() || null,
        distrito: distrito || null,
        bautizado: bautizado === "si",
        activo: activo === "si",
        notas: notas.trim() || null,
      };

      if (isEditing && editData) {
        await personasService.actualizar(editData.id, input);
        toast.success("Persona actualizada");
      } else {
        await personasService.crear(input);
        toast.success("Persona registrada");
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
          <DialogTitle>{isEditing ? "Editar persona" : "Registrar persona"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre completo *</Label>
            <Input
              placeholder="Nombre y apellidos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Contacto</Label>
              <Input
                placeholder="Teléfono / WhatsApp"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
              />
            </div>
            <div>
              <Label>Cumpleaños — Día</Label>
              <Select value={cumpleDia} onValueChange={setCumpleDia}>
                <SelectTrigger>
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cumpleaños — Mes</Label>
              <Select value={cumpleMes} onValueChange={setCumpleMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              placeholder="Dirección completa"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Distrito</Label>
              <Select value={distrito} onValueChange={setDistrito}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRITOS_LIMA.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bautizado</Label>
              <Select value={bautizado} onValueChange={setBautizado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activo</Label>
              <Select value={activo} onValueChange={setActivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Observaciones"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary-blue hover:bg-primary-blue/90">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Registrar persona"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
