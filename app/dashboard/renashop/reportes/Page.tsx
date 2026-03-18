import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Loader2,
  Download,
  ShoppingCart,
  Percent,
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
  Legend,
} from "recharts";
import { ventasRenashopService, type VentaRenashop } from "~/services/ventasRenashopService";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PIE_COLORS = ["#f59e0b", "#2a4945", "#abd9cd", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#d8dfd6", "#8b5cf6", "#f97316"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ProductReport {
  nombre: string;
  cantidad: number;
  ingresos: number;
  costo: number;
  ganancia: number;
  margen: number;
}

export default function ReportesRenashopPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<VentaRenashop[]>([]);

  const loadData = () => {
    setLoading(true);
    ventasRenashopService
      .getVentasMes(year, month)
      .then(setVentas)
      .catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const productReports = useMemo<ProductReport[]>(() => {
    const map: Record<string, { nombre: string; cantidad: number; ingresos: number; costo: number }> = {};
    ventas.forEach((v) => {
      const key = v.producto_nombre;
      if (!map[key]) map[key] = { nombre: key, cantidad: 0, ingresos: 0, costo: 0 };
      map[key].cantidad += v.cantidad;
      map[key].ingresos += v.total;
      map[key].costo += v.costo_unitario * v.cantidad;
    });
    return Object.values(map)
      .map((p) => ({
        ...p,
        ganancia: p.ingresos - p.costo,
        margen: p.ingresos > 0 ? ((p.ingresos - p.costo) / p.ingresos) * 100 : 0,
      }))
      .sort((a, b) => b.ingresos - a.ingresos);
  }, [ventas]);

  const totalIngresos = productReports.reduce((s, p) => s + p.ingresos, 0);
  const totalCosto = productReports.reduce((s, p) => s + p.costo, 0);
  const totalGanancia = totalIngresos - totalCosto;
  const margenGlobal = totalIngresos > 0 ? (totalGanancia / totalIngresos) * 100 : 0;
  const totalUnidades = productReports.reduce((s, p) => s + p.cantidad, 0);

  const gananciasPorDia = useMemo(() => {
    const map: Record<string, { dia: string; ingresos: number; costo: number; ganancia: number }> = {};
    ventas.forEach((v) => {
      const day = new Date(v.fecha + "T12:00:00");
      const dayLabel = day.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      if (!map[dayLabel]) map[dayLabel] = { dia: dayLabel, ingresos: 0, costo: 0, ganancia: 0 };
      map[dayLabel].ingresos += v.total;
      map[dayLabel].costo += v.costo_unitario * v.cantidad;
    });
    return Object.values(map).map((d) => ({
      ...d,
      ganancia: d.ingresos - d.costo,
    }));
  }, [ventas]);

  const topGanancias = useMemo(() => {
    return productReports.slice(0, 8).map((p) => ({
      nombre: p.nombre.length > 18 ? p.nombre.slice(0, 16) + "…" : p.nombre,
      ganancia: p.ganancia,
      ingresos: p.ingresos,
      costo: p.costo,
    }));
  }, [productReports]);

  const distribucionIngresos = useMemo(() => {
    return productReports.slice(0, 8).map((p) => ({
      nombre: p.nombre,
      value: p.ingresos,
    }));
  }, [productReports]);

  const gananciasMensuales = useMemo(() => {
    const meses: { mes: string; ingresos: number; costo: number; ganancia: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      meses.push({ mes: MESES[m - 1].slice(0, 3), ingresos: 0, costo: 0, ganancia: 0 });
    }
    ventas.forEach((v) => {
      const vMonth = parseInt(v.fecha.split("-")[1], 10);
      if (vMonth >= 1 && vMonth <= 12) {
        meses[vMonth - 1].ingresos += v.total;
        meses[vMonth - 1].costo += v.costo_unitario * v.cantidad;
      }
    });
    meses.forEach((m) => { m.ganancia = m.ingresos - m.costo; });
    return meses;
  }, [ventas]);

  const exportCSV = () => {
    if (productReports.length === 0) return;
    const header = "Producto,Unidades Vendidas,Ingresos (S/),Costo (S/),Ganancia (S/),Margen (%)";
    const rows = productReports.map((p) =>
      `"${p.nombre}",${p.cantidad},${p.ingresos.toFixed(2)},${p.costo.toFixed(2)},${p.ganancia.toFixed(2)},${p.margen.toFixed(1)}`
    );
    const totalsRow = `"TOTAL",${totalUnidades},${totalIngresos.toFixed(2)},${totalCosto.toFixed(2)},${totalGanancia.toFixed(2)},${margenGlobal.toFixed(1)}`;
    const csv = "\uFEFF" + [header, ...rows, "", totalsRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `renashop-reportes-${MESES[month - 1]}-${year}.csv`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-amber-500" />
            Reportes — Renashop
          </h1>
          <p className="text-gray-600 mt-1">Análisis de ventas, costos y ganancias</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold text-gray-800 min-w-[150px] text-center">
            {MESES[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={productReports.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Ingresos</p>
                <p className="text-2xl font-bold text-amber-800">S/ {formatMoney(totalIngresos)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Costo</p>
                <p className="text-2xl font-bold text-red-800">S/ {formatMoney(totalCosto)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Ganancia</p>
                <p className="text-2xl font-bold text-green-800">S/ {formatMoney(totalGanancia)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Margen</p>
                <p className="text-2xl font-bold text-blue-800">{margenGlobal.toFixed(1)}%</p>
              </div>
              <Percent className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades vendidas</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnidades}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Ingresos vs Ganancia por día</CardTitle>
          </CardHeader>
          <CardContent>
            {gananciasPorDia.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos este mes</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gananciasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        `S/ ${formatMoney(v)}`,
                        name === "ingresos" ? "Ingresos" : name === "costo" ? "Costo" : "Ganancia",
                      ]}
                    />
                    <Legend formatter={(v) => v === "ingresos" ? "Ingresos" : v === "costo" ? "Costo" : "Ganancia"} />
                    <Bar dataKey="ingresos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ganancia" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Distribución de ingresos por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {distribucionIngresos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionIngresos}
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="nombre"
                      label={({ nombre, percent }) => `${nombre.length > 12 ? nombre.slice(0, 10) + "…" : nombre} ${(percent * 100).toFixed(0)}%`}
                    >
                      {distribucionIngresos.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`S/ ${formatMoney(v)}`, "Ingresos"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Ganancia por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {topGanancias.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topGanancias} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                    <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        `S/ ${formatMoney(v)}`,
                        name === "ganancia" ? "Ganancia" : "Ingresos",
                      ]}
                    />
                    <Bar dataKey="ganancia" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Tendencia mensual ({year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gananciasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `S/ ${formatMoney(v)}`,
                      name === "ingresos" ? "Ingresos" : name === "costo" ? "Costo" : "Ganancia",
                    ]}
                  />
                  <Legend formatter={(v) => v === "ingresos" ? "Ingresos" : v === "costo" ? "Costo" : "Ganancia"} />
                  <Line type="monotone" dataKey="ingresos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="costo" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ganancia" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">Detalle por producto — {MESES[month - 1]} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {productReports.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin ventas este mes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4">Producto</th>
                    <th className="pb-3 pr-4 text-right">Uds.</th>
                    <th className="pb-3 pr-4 text-right">Ingresos</th>
                    <th className="pb-3 pr-4 text-right">Costo</th>
                    <th className="pb-3 pr-4 text-right">Ganancia</th>
                    <th className="pb-3 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {productReports.map((p, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{p.nombre}</td>
                      <td className="py-3 pr-4 text-right text-gray-700">{p.cantidad}</td>
                      <td className="py-3 pr-4 text-right text-amber-700 font-medium">S/ {formatMoney(p.ingresos)}</td>
                      <td className="py-3 pr-4 text-right text-red-600">S/ {formatMoney(p.costo)}</td>
                      <td className="py-3 pr-4 text-right font-bold text-green-700">S/ {formatMoney(p.ganancia)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.margen >= 30 ? "bg-green-100 text-green-800"
                            : p.margen >= 15 ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {p.margen.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold text-gray-900">
                    <td className="pt-3 pr-4">TOTAL</td>
                    <td className="pt-3 pr-4 text-right">{totalUnidades}</td>
                    <td className="pt-3 pr-4 text-right text-amber-700">S/ {formatMoney(totalIngresos)}</td>
                    <td className="pt-3 pr-4 text-right text-red-600">S/ {formatMoney(totalCosto)}</td>
                    <td className="pt-3 pr-4 text-right text-green-700">S/ {formatMoney(totalGanancia)}</td>
                    <td className="pt-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        margenGlobal >= 30 ? "bg-green-100 text-green-800"
                          : margenGlobal >= 15 ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {margenGlobal.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
