import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Download,
  Search,
  UserCheck,
  UserX,
  Droplets,
} from "lucide-react";
import { personasService, type Persona } from "~/services/personasService";
import { AddPersonaModal } from "~/components/ui/add-persona-modal";

const MESES_CORTO = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatCumple(dia: number | null, mes: number | null): string {
  if (!dia || !mes) return "—";
  return `${dia} ${MESES_CORTO[mes]}`;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const load = useCallback(() => {
    setLoading(true);
    personasService
      .list()
      .then(setPersonas)
      .catch(() => { toast.error("Error al cargar personas"); setPersonas([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = personas;
    if (filtroActivo === "activos") list = list.filter((p) => p.activo);
    if (filtroActivo === "inactivos") list = list.filter((p) => !p.activo);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.distrito ?? "").toLowerCase().includes(q) ||
        (p.contacto ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [personas, filtroActivo, busqueda]);

  const totalActivos = personas.filter((p) => p.activo).length;
  const totalBautizados = personas.filter((p) => p.bautizado).length;

  const openAdd = () => { setEditingPersona(null); setModalOpen(true); };
  const openEdit = (p: Persona) => { setEditingPersona(p); setModalOpen(true); };

  const handleDelete = async (p: Persona) => {
    if (!confirm(`¿Eliminar a "${p.nombre}"?`)) return;
    try {
      await personasService.eliminar(p.id);
      toast.success("Persona eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const header = "Nombre,Contacto,Cumpleaños,Dirección,Distrito,Bautizado,Activo";
    const rows = filtered.map((p) =>
      [
        `"${p.nombre}"`,
        `"${p.contacto ?? ""}"`,
        p.cumple_dia && p.cumple_mes ? `${p.cumple_dia}/${p.cumple_mes}` : "",
        `"${p.direccion ?? ""}"`,
        `"${p.distrito ?? ""}"`,
        p.bautizado ? "Sí" : "No",
        p.activo ? "Sí" : "No",
      ].join(",")
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "personas-renacer.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-blue" />
            Personas
          </h1>
          <p className="text-gray-600 mt-1">Congregantes de la iglesia Renacer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" className="bg-primary-blue hover:bg-primary-blue/90" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Nueva persona
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total registrados</p>
                    <p className="text-2xl font-bold text-gray-900">{personas.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Activos</p>
                    <p className="text-2xl font-bold text-green-800">{totalActivos}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Bautizados</p>
                    <p className="text-2xl font-bold text-blue-800">{totalBautizados}</p>
                  </div>
                  <Droplets className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-blue" />
                  Congregantes ({filtered.length})
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-9 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={filtroActivo} onValueChange={setFiltroActivo}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="activos">Activos</SelectItem>
                      <SelectItem value="inactivos">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No se encontraron personas</p>
                  <Button size="sm" className="mt-4 bg-primary-blue hover:bg-primary-blue/90" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Registrar persona
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Cumpleaños</TableHead>
                        <TableHead>Distrito</TableHead>
                        <TableHead className="text-center">Bautizado</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => (
                        <TableRow key={p.id} className="group">
                          <TableCell className="font-medium text-gray-900">{p.nombre}</TableCell>
                          <TableCell className="text-sm text-gray-600">{p.contacto ?? "—"}</TableCell>
                          <TableCell className="text-sm text-gray-600">{formatCumple(p.cumple_dia, p.cumple_mes)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{p.distrito ?? "—"}</TableCell>
                          <TableCell className="text-center">
                            {p.bautizado ? (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">Sí</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {p.activo ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 text-xs">Inactivo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(p)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AddPersonaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={load}
        editData={editingPersona}
      />
    </div>
  );
}
