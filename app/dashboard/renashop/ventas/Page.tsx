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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ShoppingBag,
  Hash,
  Trash2,
  Edit,
  Download,
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
  LineChart,
  Line,
} from "recharts";
import {
  ventasRenashopService,
  type VentaRenashop,
} from "~/services/ventasRenashopService";
import { AddVentaModal } from "~/components/ui/add-venta-modal";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PIE_COLORS = ["#f59e0b", "#2a4945", "#abd9cd", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#d8dfd6"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function VentasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [ventas, setVentas] = useState<VentaRenashop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<VentaRenashop | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    ventasRenashopService
      .getVentasMes(year, month)
      .then(setVentas)
      .catch(() => {
        toast.error("Error al cargar ventas");
        setVentas([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const totalMes = ventas.reduce((s, v) => s + v.total, 0);
  const cantidadVentas = ventas.length;
  const productosVendidos = ventas.reduce((s, v) => s + v.cantidad, 0);

  const chartPorProducto = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      map[v.producto_nombre] = (map[v.producto_nombre] ?? 0) + v.total;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [ventas]);

  const chartPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const day = new Date(v.fecha + "T12:00:00");
      const weekNum = Math.ceil(day.getDate() / 7);
      const key = `Semana ${weekNum}`;
      map[key] = (map[key] ?? 0) + v.total;
    });
    return Object.entries(map).map(([semana, total]) => ({ semana, total }));
  }, [ventas]);

  const chartPorMetodo = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const method = v.metodo_pago || "Sin especificar";
      map[method] = (map[method] ?? 0) + v.total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventas]);

  const [tendencia, setTendencia] = useState<{ mes: string; total: number }[]>([]);
  useEffect(() => {
    const fetchTendencia = async () => {
      const result: { mes: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        let m = month - i;
        let y = year;
        while (m < 1) { m += 12; y -= 1; }
        try {
          const res = await ventasRenashopService.getResumenMes(y, m);
          result.push({ mes: `${MESES[m - 1].slice(0, 3)} ${y}`, total: res.totalVentas });
        } catch {
          result.push({ mes: `${MESES[m - 1].slice(0, 3)} ${y}`, total: 0 });
        }
      }
      setTendencia(result);
    };
    fetchTendencia();
  }, [year, month]);

  const openAdd = () => { setEditingVenta(null); setModalOpen(true); };
  const openEdit = (v: VentaRenashop) => { setEditingVenta(v); setModalOpen(true); };

  const handleDelete = async (v: VentaRenashop) => {
    if (!confirm(`¿Eliminar venta de "${v.producto_nombre}" por S/${formatMoney(v.total)}?`)) return;
    try {
      await ventasRenashopService.eliminar(v.id);
      toast.success("Venta eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    const headers = "Fecha,Producto,Cantidad,Costo Unit. (S/),P. Venta Unit. (S/),Total (S/),Ganancia (S/),Método de Pago\n";
    const rows = ventas.map((v) =>
      [v.fecha, `"${v.producto_nombre}"`, v.cantidad, v.costo_unitario.toFixed(2), v.precio_unitario.toFixed(2), v.total.toFixed(2), v.ganancia.toFixed(2), v.metodo_pago ?? ""].join(",")
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ventas-renashop-${MESES[month - 1]}-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-amber-500" />
            Ventas — Renashop
          </h1>
          <p className="text-gray-600 mt-1">Registro y reportes de ventas de la tienda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={ventas.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Nueva venta
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-primary-blue">
                {MESES[month - 1]} {year}
              </h2>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando ventas...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-amber-800">S/ {formatMoney(totalMes)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas Registradas</p>
                    <p className="text-2xl font-bold text-gray-900">{cantidadVentas}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                    <p className="text-2xl font-bold text-gray-900">{productosVendidos}</p>
                  </div>
                  <Hash className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Ventas por semana</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorDia.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartPorDia}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/${v}`} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Total"]} />
                        <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Top productos vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorProducto.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartPorProducto} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Ventas"]} />
                        <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Por método de pago</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorMetodo.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartPorMetodo}
                          cx="50%"
                          cy="50%"
                          innerRadius="35%"
                          outerRadius="70%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartPorMetodo.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Monto"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Tendencia de ventas (6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {tendencia.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendencia}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Total"]} />
                        <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Detalle de ventas ({cantidadVentas})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ventas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No hay ventas este mes</p>
                  <p className="text-sm mt-1">Registra la primera venta del mes</p>
                  <Button size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Nueva venta
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <div className="flex items-center justify-end px-4 py-3 bg-amber-50 border-b border-amber-200 text-sm">
                    <span className="text-amber-800 font-semibold">
                      Total: S/ {formatMoney(totalMes)}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Costo</TableHead>
                        <TableHead className="text-right">P. Venta</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Ganancia</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((v) => (
                        <TableRow key={v.id} className="group">
                          <TableCell className="whitespace-nowrap text-sm">{v.fecha}</TableCell>
                          <TableCell className="max-w-[180px] truncate font-medium" title={v.producto_nombre}>
                            {v.producto_nombre}
                          </TableCell>
                          <TableCell className="text-center">{v.cantidad}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-red-600">S/ {formatMoney(v.costo_unitario)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">S/ {formatMoney(v.precio_unitario)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-amber-600">
                            S/ {formatMoney(v.total)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-green-600">
                            S/ {formatMoney(v.ganancia)}
                          </TableCell>
                          <TableCell>
                            {v.metodo_pago ? (
                              <Badge variant="secondary" className="capitalize text-xs">
                                {v.metodo_pago}
                              </Badge>
                            ) : "—"}
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
        </>
      )}

      <AddVentaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={load}
        editData={editingVenta}
      />
    </div>
  );
}
