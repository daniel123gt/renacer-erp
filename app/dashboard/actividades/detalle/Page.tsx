import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { toast } from "sonner";
import { useParams, Link } from "react-router";
import {
  CalendarDays,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Target,
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  actividadesService,
  type Actividad,
  type ActividadVenta,
  type EstadoActividad,
} from "~/services/actividadesService";
import { AddActividadVentaModal } from "~/components/ui/add-actividad-venta-modal";

const PIE_COLORS = ["#f59e0b", "#2a4945", "#abd9cd", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#d8dfd6"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ESTADO_STYLES: Record<EstadoActividad, { bg: string; text: string; label: string }> = {
  pendiente: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendiente" },
  activa: { bg: "bg-green-100", text: "text-green-800", label: "Activa" },
  completada: { bg: "bg-blue-100", text: "text-blue-800", label: "Completada" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-600", label: "Cancelada" },
};

export default function ActividadDetallePage() {
  const params = useParams();
  const actividadId = params.id as string;

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [ventas, setVentas] = useState<ActividadVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<ActividadVenta | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      actividadesService.getById(actividadId),
      actividadesService.getVentas(actividadId),
    ])
      .then(([act, v]) => { setActividad(act); setVentas(v); })
      .catch(() => toast.error("Error al cargar"))
      .finally(() => setLoading(false));
  }, [actividadId]);

  useEffect(() => { load(); }, [load]);

  const vendidas = actividad?.vendidas ?? 0;
  const recaudado = actividad?.recaudado ?? 0;
  const totalPagado = actividad?.total_pagado ?? 0;
  const costoTotal = actividad?.costo_total ?? 0;
  const meta = actividad?.meta_cantidad ?? 0;
  const metaRecaudacion = meta * (actividad?.precio_unitario ?? 0);
  const progreso = meta > 0 ? Math.min((vendidas / meta) * 100, 100) : 0;
  const faltantes = Math.max(0, meta - vendidas);
  const ganancia = totalPagado - costoTotal;
  const pendienteCobro = recaudado - totalPagado;

  const topVendedores = useMemo(() => {
    const map: Record<string, { nombre: string; cantidad: number; monto: number }> = {};
    ventas.forEach((v) => {
      if (!map[v.persona]) map[v.persona] = { nombre: v.persona, cantidad: 0, monto: 0 };
      map[v.persona].cantidad += v.cantidad;
      map[v.persona].monto += v.monto;
    });
    return Object.values(map).sort((a, b) => b.cantidad - a.cantidad);
  }, [ventas]);

  const personasUnicas = topVendedores.length;

  const ventasPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const day = new Date(v.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      map[day] = (map[day] ?? 0) + v.cantidad;
    });
    return Object.entries(map).map(([dia, cantidad]) => ({ dia, cantidad }));
  }, [ventas]);

  const openAdd = () => { setEditingVenta(null); setModalOpen(true); };
  const openEdit = (v: ActividadVenta) => { setEditingVenta(v); setModalOpen(true); };

  const handleDelete = async (v: ActividadVenta) => {
    if (!confirm(`¿Eliminar venta de ${v.persona} (${v.cantidad} uds)?`)) return;
    try {
      await actividadesService.eliminarVenta(v.id);
      toast.success("Venta eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    if (ventas.length === 0) return;
    const header = "Fecha,Persona,Cantidad,Monto (S/),Método,Entregado,Canceló,Pagado (S/)";
    const rows = ventas.map((v) =>
      [v.fecha, `"${v.persona}"`, v.cantidad, v.monto.toFixed(2), v.metodo_pago ?? "", v.entregado ? "Sí" : "No", v.cancelado ? "Sí" : "No", v.monto_pagado.toFixed(2)].join(",")
    );
    const totalRow = `"TOTAL","",${vendidas},${recaudado.toFixed(2)},"","","",${totalPagado.toFixed(2)}`;
    const csv = "\uFEFF" + [header, ...rows, "", totalRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `actividad-${actividad?.nombre ?? "detalle"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Actividad no encontrada</p>
        <Link to="/actividades"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button></Link>
      </div>
    );
  }

  const estilo = ESTADO_STYLES[actividad.estado];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/actividades" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver a actividades
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{actividad.nombre}</h1>
            <Badge variant="secondary" className="text-xs">{actividad.tipo}</Badge>
            <Badge className={`${estilo.bg} ${estilo.text} text-xs`}>{estilo.label}</Badge>
          </div>
          {actividad.proposito && <p className="text-gray-600 mt-1">{actividad.proposito}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={ventas.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Registrar venta
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Progreso hacia la meta</span>
                <span className="font-bold text-gray-900">{vendidas} / {meta} ({progreso.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div
                  className={`h-5 rounded-full transition-all flex items-center justify-center text-white text-xs font-bold ${
                    progreso >= 100 ? "bg-green-500" : progreso >= 50 ? "bg-amber-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.max(progreso, 8)}%` }}
                >
                  {progreso >= 15 ? `${progreso.toFixed(0)}%` : ""}
                </div>
              </div>
              {faltantes > 0 && (
                <p className="text-sm text-gray-500 mt-1">Faltan <strong>{faltantes}</strong> para llegar a la meta</p>
              )}
              {faltantes === 0 && vendidas > 0 && (
                <p className="text-sm text-green-600 font-semibold mt-1">Meta alcanzada</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-amber-700">Total ventas</p>
            <p className="text-xl font-bold text-amber-800">S/ {formatMoney(recaudado)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-green-700">Cobrado</p>
            <p className="text-xl font-bold text-green-800">S/ {formatMoney(totalPagado)}</p>
          </CardContent>
        </Card>
        {pendienteCobro > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-yellow-700">Pendiente cobro</p>
              <p className="text-xl font-bold text-yellow-800">S/ {formatMoney(pendienteCobro)}</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-red-700">Costo insumos</p>
            <p className="text-xl font-bold text-red-800">S/ {formatMoney(costoTotal)}</p>
          </CardContent>
        </Card>
        <Card className={ganancia >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600">Ganancia neta</p>
            <p className={`text-xl font-bold ${ganancia >= 0 ? "text-green-800" : "text-red-800"}`}>
              S/ {formatMoney(ganancia)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-500">Vendedores</p>
            <p className="text-xl font-bold text-gray-900">{personasUnicas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Ventas por día</CardTitle>
          </CardHeader>
          <CardContent>
            {ventasPorDia.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v, "Cantidad"]} />
                    <Bar dataKey="cantidad" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Top vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topVendedores.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topVendedores.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="cantidad"
                      nameKey="nombre"
                      label={({ nombre, percent }) => `${nombre.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                    >
                      {topVendedores.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Vendidos"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Vendedores Table */}
      {topVendedores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Ranking de vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVendedores.map((v, i) => (
                    <TableRow key={v.nombre}>
                      <TableCell className="font-bold text-gray-400">{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {i === 0 && <Trophy className="w-4 h-4 text-amber-500 inline mr-1" />}
                        {v.nombre}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{v.cantidad}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">S/ {formatMoney(v.monto)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ventas Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Detalle de ventas ({ventas.length})</span>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Registrar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ventas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay ventas registradas</p>
              <Button size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Primera venta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-center">Entregado</TableHead>
                    <TableHead className="text-center">Canceló</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.map((v) => (
                    <TableRow key={v.id} className="group">
                      <TableCell className="text-sm whitespace-nowrap">{v.fecha}</TableCell>
                      <TableCell className="font-medium">{v.persona}</TableCell>
                      <TableCell className="text-center font-semibold">{v.cantidad}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700 tabular-nums">S/ {formatMoney(v.monto)}</TableCell>
                      <TableCell>
                        {v.metodo_pago ? (
                          <Badge variant="secondary" className="capitalize text-xs">{v.metodo_pago}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {v.entregado ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {v.cancelado ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {v.monto_pagado > 0 ? (
                          <span className={v.monto_pagado >= v.monto ? "text-green-600 font-semibold" : "text-yellow-600"}>
                            S/ {formatMoney(v.monto_pagado)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(v)}>
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

      <AddActividadVentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={load}
        actividadId={actividadId}
        precioUnitario={actividad.precio_unitario}
        editData={editingVenta}
      />
    </div>
  );
}
