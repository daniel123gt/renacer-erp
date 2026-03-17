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
  TrendingDown,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ReceiptText,
  Tag,
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
  Legend,
} from "recharts";
import {
  finanzasService,
  type Transaccion,
} from "~/services/finanzasService";
import { AddTransaccionModal } from "~/components/ui/add-transaccion-modal";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#2a4945", "#abd9cd", "#6366f1", "#8b5cf6", "#ec4899"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function firstDayOfMonth(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function lastDayOfMonth(y: number, m: number) {
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export default function SalidasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [salidas, setSalidas] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const from = firstDayOfMonth(year, month);
    const to = lastDayOfMonth(year, month);
    finanzasService
      .getTransaccionesPorTipo("salida", from, to)
      .then(setSalidas)
      .catch(() => {
        toast.error("Error al cargar salidas");
        setSalidas([]);
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

  const totalMes = salidas.reduce((s, t) => s + t.monto, 0);
  const cantidadSalidas = salidas.length;

  const categoriasUnicas = useMemo(() => {
    const set = new Set(salidas.map((t) => t.categoria_nombre).filter(Boolean));
    return set.size;
  }, [salidas]);

  const chartPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    salidas.forEach((t) => {
      const cat = t.categoria_nombre || "Sin categoría";
      map[cat] = (map[cat] ?? 0) + t.monto;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [salidas]);

  const chartPorSemana = useMemo(() => {
    const weeks: Record<string, number> = {};
    salidas.forEach((t) => {
      const day = new Date(t.fecha + "T12:00:00");
      const weekNum = Math.ceil(day.getDate() / 7);
      const key = `Semana ${weekNum}`;
      weeks[key] = (weeks[key] ?? 0) + t.monto;
    });
    return Object.entries(weeks).map(([semana, total]) => ({ semana, total }));
  }, [salidas]);

  const chartPorMetodo = useMemo(() => {
    const map: Record<string, number> = {};
    salidas.forEach((t) => {
      const method = t.metodo_pago || "Sin especificar";
      map[method] = (map[method] ?? 0) + t.monto;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [salidas]);

  const [tendencia, setTendencia] = useState<{ mes: string; total: number }[]>([]);
  useEffect(() => {
    const fetchTendencia = async () => {
      const result: { mes: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        let m = month - i;
        let y = year;
        while (m < 1) { m += 12; y -= 1; }
        const from = firstDayOfMonth(y, m);
        const to = lastDayOfMonth(y, m);
        try {
          const txs = await finanzasService.getTransaccionesPorTipo("salida", from, to);
          result.push({
            mes: `${MESES[m - 1].slice(0, 3)} ${y}`,
            total: txs.reduce((s, t) => s + t.monto, 0),
          });
        } catch {
          result.push({ mes: `${MESES[m - 1].slice(0, 3)} ${y}`, total: 0 });
        }
      }
      setTendencia(result);
    };
    fetchTendencia();
  }, [year, month]);

  const openAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const openEdit = (tx: Transaccion) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleDelete = async (tx: Transaccion) => {
    if (!confirm(`¿Eliminar "${tx.descripcion}" por S/${formatMoney(tx.monto)}?`)) return;
    try {
      await finanzasService.eliminar(tx.id);
      toast.success("Salida eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    const headers = "Fecha,Categoría,Descripción,Persona,Método de Pago,Monto (S/)\n";
    const rows = salidas.map((t) =>
      [
        t.fecha,
        `"${t.categoria_nombre ?? ""}"`,
        `"${t.descripcion}"`,
        `"${t.persona ?? ""}"`,
        t.metodo_pago ?? "",
        t.monto.toFixed(2),
      ].join(",")
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `salidas-${MESES[month - 1]}-${year}.csv`;
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
            <TrendingDown className="w-7 h-7 text-red-500" />
            Salidas
          </h1>
          <p className="text-gray-600 mt-1">Registro y reportes de todos los egresos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={salidas.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Nueva salida
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
            <Loader2 className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
            <p className="text-gray-600">Cargando salidas...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Egresos del Mes</p>
                    <p className="text-2xl font-bold text-red-800">S/ {formatMoney(totalMes)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salidas Registradas</p>
                    <p className="text-2xl font-bold text-gray-900">{cantidadSalidas}</p>
                  </div>
                  <ReceiptText className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorías Usadas</p>
                    <p className="text-2xl font-bold text-gray-900">{categoriasUnicas}</p>
                  </div>
                  <Tag className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Distribución por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorCategoria.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[260px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartPorCategoria}
                          cx="50%"
                          cy="50%"
                          innerRadius="30%"
                          outerRadius="70%"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartPorCategoria.map((_, i) => (
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
                <CardTitle className="text-sm font-semibold text-gray-700">Egresos por semana</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorSemana.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartPorSemana}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/${v}`} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Total"]} />
                        <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Monto por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {chartPorCategoria.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartPorCategoria} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Total"]} />
                        <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">Tendencia egresos (últimos 6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {tendencia.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendencia}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
                        <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Total"]} />
                        <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
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
                <TrendingDown className="w-5 h-5 text-red-500" />
                Detalle de salidas ({cantidadSalidas})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salidas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No hay salidas este mes</p>
                  <p className="text-sm mt-1">Registra el primer egreso del mes</p>
                  <Button size="sm" className="mt-4 bg-red-500 hover:bg-red-600" onClick={openAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Nueva salida
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <div className="flex items-center justify-end px-4 py-3 bg-red-50 border-b border-red-200 text-sm">
                    <span className="text-red-800 font-semibold">
                      Total: S/ {formatMoney(totalMes)}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Persona</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salidas.map((tx) => (
                        <TableRow key={tx.id} className="group">
                          <TableCell className="whitespace-nowrap text-sm">{tx.fecha}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {tx.categoria_nombre ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={tx.descripcion}>
                            {tx.descripcion}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{tx.persona ?? "—"}</TableCell>
                          <TableCell>
                            {tx.metodo_pago ? (
                              <Badge variant="secondary" className="capitalize text-xs">
                                {tx.metodo_pago}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-red-600">
                            S/ {formatMoney(tx.monto)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(tx)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(tx)}>
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

      <AddTransaccionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tipo="salida"
        onSuccess={load}
        editData={editingTx}
      />
    </div>
  );
}
