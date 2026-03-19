import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  CalendarDays,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  actividadesService,
  type Actividad,
  type EstadoActividad,
} from "~/services/actividadesService";
import { AddActividadModal } from "~/components/ui/add-actividad-modal";
import { getActividadHeroStyle } from "~/lib/actividadTipoHero";

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ESTADO_STYLES: Record<EstadoActividad, { bg: string; text: string; label: string }> = {
  pendiente: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendiente" },
  activa: { bg: "bg-green-100", text: "text-green-800", label: "Activa" },
  completada: { bg: "bg-blue-100", text: "text-blue-800", label: "Completada" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelada" },
};

const FILTROS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "activa", label: "Activas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "completada", label: "Completadas" },
  { value: "cancelada", label: "Canceladas" },
];

export default function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAct, setEditingAct] = useState<Actividad | null>(null);
  const [filtro, setFiltro] = useState("todas");

  const load = useCallback(() => {
    setLoading(true);
    actividadesService
      .list()
      .then(setActividades)
      .catch(() => { toast.error("Error al cargar actividades"); setActividades([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filtro === "todas") return actividades;
    return actividades.filter((a) => a.estado === filtro);
  }, [actividades, filtro]);

  const stats = useMemo(() => {
    const activas = actividades.filter((a) => a.estado === "activa").length;
    const pendientes = actividades.filter((a) => a.estado === "pendiente").length;
    const completadas = actividades.filter((a) => a.estado === "completada").length;
    return { activas, pendientes, completadas, total: actividades.length };
  }, [actividades]);

  const openAdd = () => { setEditingAct(null); setModalOpen(true); };
  const openEdit = (a: Actividad) => { setEditingAct(a); setModalOpen(true); };

  const handleDelete = async (a: Actividad) => {
    if (!confirm(`¿Eliminar la actividad "${a.nombre}"? Se eliminarán todas sus ventas.`)) return;
    try {
      await actividadesService.eliminar(a.id);
      toast.success("Actividad eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-amber-500" />
            Actividades
          </h1>
          <p className="text-gray-600 mt-1">Actividades económicas de recaudación</p>
        </div>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Nueva actividad
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
            <Card className="bg-green-50 border-green-200"><CardContent className="pt-6 text-center"><p className="text-sm text-green-700">Activas</p><p className="text-2xl font-bold text-green-800">{stats.activas}</p></CardContent></Card>
            <Card className="bg-yellow-50 border-yellow-200"><CardContent className="pt-6 text-center"><p className="text-sm text-yellow-700">Pendientes</p><p className="text-2xl font-bold text-yellow-800">{stats.pendientes}</p></CardContent></Card>
            <Card className="bg-blue-50 border-blue-200"><CardContent className="pt-6 text-center"><p className="text-sm text-blue-700">Completadas</p><p className="text-2xl font-bold text-blue-800">{stats.completadas}</p></CardContent></Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            {FILTROS.map((f) => (
              <Button
                key={f.value}
                variant={filtro === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltro(f.value)}
                className={filtro === f.value ? "bg-amber-500 hover:bg-amber-600" : ""}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No hay actividades</p>
                <Button size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
                  <Plus className="w-4 h-4 mr-1" /> Crear primera actividad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => {
                const vendidas = a.vendidas ?? 0;
                const recaudado = a.recaudado ?? 0;
                const progreso = a.meta_cantidad > 0 ? Math.min((vendidas / a.meta_cantidad) * 100, 100) : 0;
                const metaRecaudacion = a.meta_cantidad * a.precio_unitario;
                const estilo = ESTADO_STYLES[a.estado];

                const hero = getActividadHeroStyle(a.tipo);

                return (
                  <Card key={a.id} className="hover:shadow-md transition-shadow group relative overflow-hidden p-0">
                    <div
                      className={`relative h-40 sm:h-44 bg-gradient-to-br ${hero.gradientClass} flex items-center justify-center select-none`}
                      aria-hidden
                    >
                      <span
                        className="text-7xl sm:text-8xl drop-shadow-sm leading-none"
                        style={{ lineHeight: 1 }}
                      >
                        {hero.emoji}
                      </span>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 shadow-sm"
                          onClick={() => openEdit(a)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 shadow-sm text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(a)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="pt-4 pb-6 px-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{a.tipo}</Badge>
                            <Badge className={`${estilo.bg} ${estilo.text} text-xs`}>{estilo.label}</Badge>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg truncate">{a.nombre}</h3>
                          {a.proposito && (
                            <p className="text-sm text-gray-500 truncate">{a.proposito}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progreso</span>
                          <span className="font-semibold text-gray-900">{vendidas} / {a.meta_cantidad}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              progreso >= 100 ? "bg-green-500" : progreso >= 50 ? "bg-amber-500" : "bg-red-400"
                            }`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{progreso.toFixed(0)}% completado</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-gray-500 text-xs">Recaudado</p>
                          <p className="font-bold text-amber-700">S/ {formatMoney(recaudado)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-gray-500 text-xs">Meta</p>
                          <p className="font-bold text-gray-700">S/ {formatMoney(metaRecaudacion)}</p>
                        </div>
                      </div>

                      {a.fecha_inicio && (
                        <p className="text-xs text-gray-400">
                          {a.fecha_inicio}{a.fecha_fin ? ` — ${a.fecha_fin}` : ""}
                        </p>
                      )}

                      <Link to={`/actividades/${a.id}`}>
                        <Button variant="outline" size="sm" className="w-full mt-2 group/btn">
                          Ver detalle <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AddActividadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={load}
        editData={editingAct}
      />
    </div>
  );
}
