import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  Store,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowRight,
  BarChart3,
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
  ventasRenashopService,
  type VentaRenashop,
  totalVenta,
} from "~/services/ventasRenashopService";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";

const PIE_COLORS = ["#f59e0b", "#2a4945", "#abd9cd", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#d8dfd6"];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RenashopPage() {
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<VentaRenashop[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ventasHoy, setVentasHoy] = useState({ totalVentas: 0, cantidadVentas: 0 });

  useEffect(() => {
    setLoading(true);
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    Promise.all([
      ventasRenashopService.getVentasMes(y, m),
      inventoryService.list(),
      ventasRenashopService.getResumenHoy(),
    ])
      .then(([v, inv, hoy]) => {
        setVentas(v);
        setInventory(inv);
        setVentasHoy(hoy);
      })
      .catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false));
  }, []);

  const totalMes = ventas.reduce((s, v) => s + totalVenta(v), 0);
  const cantidadMes = ventas.length;

  const totalProductos = inventory.length;
  const stockBajo = inventory.filter((i) => i.status === "low_stock").length;
  const sinStock = inventory.filter((i) => i.status === "out_of_stock").length;
  const valorInventario = inventory.reduce((s, i) => s + i.currentStock * i.price, 0);

  const topProductos = useMemo(() => {
    const map: Record<string, { nombre: string; total: number; cantidad: number }> = {};
    ventas.forEach((v) => {
      v.lineas.forEach((l) => {
        const key = l.producto_nombre;
        if (!map[key]) map[key] = { nombre: key, total: 0, cantidad: 0 };
        map[key].total += l.total;
        map[key].cantidad += l.cantidad;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [ventas]);

  const ventasPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const day = new Date(v.fecha + "T12:00:00");
      const dayName = day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
      map[dayName] = (map[dayName] ?? 0) + totalVenta(v);
    });
    return Object.entries(map)
      .map(([dia, total]) => ({ dia, total }))
      .slice(-14);
  }, [ventas]);

  const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-7 h-7 text-amber-500" />
            Renashop
          </h1>
          <p className="text-gray-600 mt-1">Panel general de la tienda — {MESES[now.getMonth()]} {now.getFullYear()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Ventas hoy</p>
                <p className="text-2xl font-bold text-amber-800">S/ {formatMoney(ventasHoy.totalVentas)}</p>
                <p className="text-xs text-amber-600 mt-1">{ventasHoy.cantidadVentas} venta(s)</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Ventas del mes</p>
                <p className="text-2xl font-bold text-green-800">S/ {formatMoney(totalMes)}</p>
                <p className="text-xs text-green-600 mt-1">{cantidadMes} venta(s)</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
                <p className="text-xs text-gray-500 mt-1">Valor: S/ {formatMoney(valorInventario)}</p>
              </div>
              <Package className="w-8 h-8 text-primary-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className={stockBajo + sinStock > 0 ? "bg-red-50 border-red-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas de stock</p>
                <p className="text-2xl font-bold text-gray-900">{stockBajo + sinStock}</p>
                <div className="flex gap-2 mt-1">
                  {stockBajo > 0 && <Badge className="bg-yellow-100 text-yellow-800 text-xs">{stockBajo} bajo</Badge>}
                  {sinStock > 0 && <Badge className="bg-red-100 text-red-800 text-xs">{sinStock} sin stock</Badge>}
                  {stockBajo + sinStock === 0 && <span className="text-xs text-green-600">Todo en orden</span>}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Ventas por día (este mes)</CardTitle>
          </CardHeader>
          <CardContent>
            {ventasPorDia.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin ventas este mes</p>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
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
            <CardTitle className="text-sm font-semibold text-gray-700">Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProductos}
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="nombre"
                      label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                    >
                      {topProductos.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`S/${formatMoney(v)}`, "Ventas"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link to="/renashop/ventas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Ventas</p>
                    <p className="text-sm text-gray-500">Registrar y ver historial</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/renashop/compras">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Compras</p>
                    <p className="text-sm text-gray-500">Salidas que descuentan capital Renashop</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/renashop/inventario">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Inventario</p>
                    <p className="text-sm text-gray-500">Gestionar productos y stock</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/renashop/reportes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Reportes</p>
                    <p className="text-sm text-gray-500">Ventas, costos y ganancias</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
