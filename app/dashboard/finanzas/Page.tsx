import { useState, useEffect, useCallback } from "react";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Trash2,
  Edit,
  Download,
} from "lucide-react";
import {
  finanzasService,
  type BalanceMensual,
  type Transaccion,
} from "~/services/finanzasService";
import { AddTransaccionModal } from "~/components/ui/add-transaccion-modal";
import { getAppName } from "~/lib/erpBranding";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanzasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [balance, setBalance] = useState<BalanceMensual | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<"entrada" | "salida">("entrada");
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    finanzasService
      .getBalanceMensual(year, month)
      .then(setBalance)
      .catch(() => {
        toast.error("Error al cargar el balance");
        setBalance(null);
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

  const openAddModal = (tipo: "entrada" | "salida") => {
    setEditingTx(null);
    setModalTipo(tipo);
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaccion) => {
    setEditingTx(tx);
    setModalTipo(tx.tipo);
    setModalOpen(true);
  };

  const handleDelete = async (tx: Transaccion) => {
    if (!confirm(`¿Eliminar "${tx.descripcion}" por S/${formatMoney(tx.monto)}?`)) return;
    try {
      await finanzasService.eliminar(tx.id);
      toast.success("Transacción eliminada");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleExportCSV = () => {
    if (!balance) return;
    const all = [...balance.entradas, ...balance.salidas].sort(
      (a, b) => a.fecha.localeCompare(b.fecha)
    );
    const headers = "Fecha,Tipo,Categoría,Descripción,Persona,Monto (S/)\n";
    const rows = all.map((t) =>
      [
        t.fecha,
        t.tipo === "entrada" ? "Entrada" : "Salida",
        `"${t.categoria_nombre ?? ""}"`,
        `"${t.descripcion}"`,
        `"${t.persona ?? ""}"`,
        t.monto.toFixed(2),
      ].join(",")
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `balance-${MESES[month - 1]}-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success("CSV exportado");
  };

  const renderTransactionRow = (tx: Transaccion) => (
    <TableRow key={tx.id} className="group">
      <TableCell className="whitespace-nowrap text-sm">{tx.fecha}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={
            tx.tipo === "entrada"
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-red-100 text-red-800 border-red-200"
          }
        >
          {tx.categoria_nombre ?? (tx.tipo === "entrada" ? "Entrada" : "Salida")}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[250px] truncate" title={tx.descripcion}>
        {tx.descripcion}
      </TableCell>
      <TableCell className="text-sm text-gray-600">{tx.persona ?? "—"}</TableCell>
      <TableCell
        className={`text-right font-semibold tabular-nums ${
          tx.tipo === "entrada" ? "text-green-600" : "text-red-600"
        }`}
      >
        {tx.tipo === "entrada" ? "+" : "-"} S/ {formatMoney(tx.monto)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(tx)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(tx)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-blue" />
            Finanzas
          </h1>
          <p className="text-gray-600 mt-1">Balance mensual de la iglesia</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => openAddModal("entrada")}
          >
            <Plus className="w-4 h-4 mr-1" /> Entrada
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => openAddModal("salida")}
          >
            <Plus className="w-4 h-4 mr-1" /> Salida
          </Button>
        </div>
      </div>

      {/* Navegación de mes */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-primary-blue">
                Balance Mes: {MESES[month - 1]} {year}
              </h2>
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
              >
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
            <p className="text-gray-600">Cargando balance...</p>
          </CardContent>
        </Card>
      ) : balance ? (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fondo Anterior</p>
                    <p className="text-2xl font-bold text-gray-700">
                      S/ {formatMoney(balance.fondoAnterior)}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Entradas</p>
                    <p className="text-2xl font-bold text-green-800">
                      S/ {formatMoney(balance.totalEntradas)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {balance.entradas.length} registros
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Salidas</p>
                    <p className="text-2xl font-bold text-red-800">
                      S/ {formatMoney(balance.totalSalidas)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {balance.salidas.length} registros
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={balance.saldo >= 0 ? "bg-primary-blue/5 border-primary-blue/20" : "bg-orange-50 border-orange-200"}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saldo Actual</p>
                    <p className={`text-2xl font-bold ${balance.saldo >= 0 ? "text-primary-blue" : "text-orange-700"}`}>
                      S/ {formatMoney(balance.saldo)}
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${balance.saldo >= 0 ? "text-primary-blue" : "text-orange-500"}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de balance tipo Excel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entradas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-green-700 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Entradas
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => openAddModal("entrada")}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balance.entradas.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No hay entradas este mes
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Persona</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balance.entradas.map(renderTransactionRow)}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {balance.fondoAnterior > 0 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t text-sm">
                    <span className="font-medium text-gray-600">Fondo Anterior</span>
                    <span className="font-bold text-gray-700">S/ {formatMoney(balance.fondoAnterior)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200 bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <span className="font-bold text-green-800">TOTAL ENTRADAS</span>
                  <span className="font-bold text-green-800 text-lg">S/ {formatMoney(balance.totalEntradas)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Salidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-red-700 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> Salidas
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openAddModal("salida")}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balance.salidas.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No hay salidas este mes
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Persona</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balance.salidas.map(renderTransactionRow)}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-red-200 bg-red-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <span className="font-bold text-red-800">TOTAL SALIDAS</span>
                  <span className="font-bold text-red-800 text-lg">S/ {formatMoney(balance.totalSalidas)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saldo final */}
          <Card className={balance.saldo >= 0 ? "bg-gray-800" : "bg-orange-700"}>
            <CardContent className="py-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">SALDO ACTUAL</span>
                <span className="text-3xl font-bold text-green-400">
                  S/ {formatMoney(balance.saldo)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Exportar */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <p>No se pudo cargar el balance</p>
          </CardContent>
        </Card>
      )}

      <AddTransaccionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tipo={modalTipo}
        onSuccess={load}
        editData={editingTx}
      />
    </div>
  );
}
