import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
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
  ChevronDown,
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
  totalVenta,
  totalGananciaVenta,
  unidadesVenta,
  resumenProductosVenta,
} from "~/services/ventasRenashopService";
import { AddVentaModal } from "~/components/ui/add-venta-modal";
import { useAuthStore, isVendedor } from "~/store/authStore";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const PIE_COLORS = ["#f59e0b", "#2a4945", "#abd9cd", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#d8dfd6"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Columnas de la tabla principal (sin contar la celda de expand). */
function mainTableColCount(vendedor: boolean): number {
  return vendedor ? 9 : 10;
}

export default function VentasPage() {
  const { user } = useAuthStore();
  const vendedor = isVendedor(user);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [ventas, setVentas] = useState<VentaRenashop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<VentaRenashop | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const totalCobrado = ventas
    .filter((v) => v.estado_pago !== "pendiente")
    .reduce((s, v) => s + totalVenta(v), 0);
  const totalPendiente = ventas
    .filter((v) => v.estado_pago === "pendiente")
    .reduce((s, v) => s + totalVenta(v), 0);
  const totalMes = totalCobrado + totalPendiente;
  const cantidadVentas = ventas.length;
  const productosVendidos = ventas.reduce((s, v) => s + unidadesVenta(v), 0);

  const chartPorProducto = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      v.lineas.forEach((l) => {
        map[l.producto_nombre] = (map[l.producto_nombre] ?? 0) + l.total;
      });
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
      map[key] = (map[key] ?? 0) + totalVenta(v);
    });
    return Object.entries(map).map(([semana, total]) => ({ semana, total }));
  }, [ventas]);

  const chartPorMetodo = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const method = v.metodo_pago || "Sin especificar";
      map[method] = (map[method] ?? 0) + totalVenta(v);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventas]);

  const [tendencia, setTendencia] = useState<{ mes: string; total: number }[]>([]);
  useEffect(() => {
    if (vendedor) {
      setTendencia([]);
      return;
    }
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
    void fetchTendencia();
  }, [year, month, vendedor]);

  const openAdd = () => { setEditingVenta(null); setModalOpen(true); };
  const openEdit = (v: VentaRenashop) => { setEditingVenta(v); setModalOpen(true); };

  const handleDelete = async (v: VentaRenashop) => {
    const t = totalVenta(v);
    if (
      !confirm(
        `¿Eliminar la venta del ${v.fecha} (${v.lineas.length} producto(s), total S/ ${formatMoney(t)})?`
      )
    )
      return;
    try {
      await ventasRenashopService.eliminar(v.id);
      toast.success("Venta eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    const headers = vendedor
      ? "Id venta,Fecha,Nombre,Producto,Cantidad,P. Venta Unit. (S/),Total línea (S/),Método de pago,Estado pago\n"
      : "Id venta,Fecha,Nombre,Producto,Cantidad,Costo Unit. (S/),P. Venta Unit. (S/),Total línea (S/),Ganancia línea (S/),Método de pago,Estado pago\n";
    const rows = ventas.flatMap((v) =>
      v.lineas.map((l) => {
        const base = [
          v.id,
          v.fecha,
          `"${(v.nombre ?? "").replace(/"/g, '""')}"`,
          `"${l.producto_nombre.replace(/"/g, '""')}"`,
          l.cantidad,
        ];
        if (vendedor) {
          return [
            ...base,
            l.precio_unitario.toFixed(2),
            l.total.toFixed(2),
            v.metodo_pago ?? "",
            v.estado_pago === "pendiente" ? "pendiente" : "pagado",
          ].join(",");
        }
        return [
          ...base,
          l.costo_unitario.toFixed(2),
          l.precio_unitario.toFixed(2),
          l.total.toFixed(2),
          l.ganancia.toFixed(2),
          v.metodo_pago ?? "",
          v.estado_pago === "pendiente" ? "pendiente" : "pagado",
        ].join(",");
      })
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
          <p className="text-gray-600 mt-1">
            {vendedor ? "Registra y consulta las ventas del mes." : "Registro y reportes de ventas de la tienda"}
          </p>
        </div>
        <div className="flex gap-2">
          {!vendedor && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={ventas.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
          )}
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
          {!vendedor && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">Ingresos cobrados</p>
                    <p className="text-2xl font-bold text-amber-800">S/ {formatMoney(totalCobrado)}</p>
                    {totalPendiente > 0 && (
                      <p className="text-xs text-amber-700/80 mt-1">
                        + S/ {formatMoney(totalPendiente)} pendiente
                      </p>
                    )}
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100 bg-orange-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Pendiente de cobro</p>
                    <p className="text-2xl font-bold text-orange-900">S/ {formatMoney(totalPendiente)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-300" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas (tickets)</p>
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
                    <p className="text-sm font-medium text-gray-600">Productos vendidos</p>
                    <p className="text-2xl font-bold text-gray-900">{productosVendidos}</p>
                  </div>
                  <Hash className="w-8 h-8 text-primary-blue" />
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {!vendedor && (
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
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Detalle de ventas — {cantidadVentas} ticket(s)
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
                        <TableHead className="w-10" />
                        <TableHead>Fecha</TableHead>
                        <TableHead className="max-w-[100px]">Nombre</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead className="text-center">Ítems</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {!vendedor && <TableHead className="text-right">Ganancia</TableHead>}
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[90px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((v) => {
                        const open = expandedIds.has(v.id);
                        return (
                          <Fragment key={v.id}>
                            <TableRow className="group">
                              <TableCell className="p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleExpand(v.id)}
                                  aria-expanded={open}
                                >
                                  {open ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm font-medium">{v.fecha}</TableCell>
                              <TableCell className="max-w-[100px] text-sm text-gray-700 truncate" title={v.nombre ?? ""}>
                                {v.nombre?.trim() ? v.nombre : "—"}
                              </TableCell>
                              <TableCell className="max-w-[220px]">
                                <span className="text-sm" title={resumenProductosVenta(v)}>
                                  {resumenProductosVenta(v)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center tabular-nums">{v.lineas.length}</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums text-amber-600">
                                S/ {formatMoney(totalVenta(v))}
                              </TableCell>
                              {!vendedor && (
                                <TableCell className="text-right font-semibold tabular-nums text-green-600">
                                  S/ {formatMoney(totalGananciaVenta(v))}
                                </TableCell>
                              )}
                              <TableCell>
                                {v.metodo_pago ? (
                                  <Badge variant="secondary" className="capitalize text-xs">
                                    {v.metodo_pago}
                                  </Badge>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell>
                                {v.estado_pago === "pendiente" ? (
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs">
                                    Pendiente
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                                    Pagado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDelete(v)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {open && (
                              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                <TableCell colSpan={mainTableColCount(vendedor)} className="p-0">
                                  <div className="px-4 py-3 pl-12 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Líneas del ticket
                                    </p>
                                    <div className="overflow-x-auto rounded-md border bg-white">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b bg-gray-50 text-left text-gray-600">
                                            <th className="p-2 pr-4">Producto</th>
                                            <th className="p-2 text-center w-16">Cant.</th>
                                            <th className="p-2 text-right">P. venta</th>
                                            <th className="p-2 text-right">Total</th>
                                            {!vendedor && <th className="p-2 text-right">Ganancia</th>}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {v.lineas.map((l) => (
                                            <tr key={l.id} className="border-b last:border-0">
                                              <td className="p-2 pr-4 font-medium">{l.producto_nombre}</td>
                                              <td className="p-2 text-center tabular-nums">{l.cantidad}</td>
                                              <td className="p-2 text-right tabular-nums">S/ {formatMoney(l.precio_unitario)}</td>
                                              <td className="p-2 text-right tabular-nums text-amber-700">
                                                S/ {formatMoney(l.total)}
                                              </td>
                                              {!vendedor && (
                                                <td className="p-2 text-right tabular-nums text-green-700">
                                                  S/ {formatMoney(l.ganancia)}
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
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
