import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TrendingDown, Plus, Loader2, ChevronLeft, ChevronRight, Download, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { AddRenashopCompraModal } from "~/components/ui/add-renashop-compra-modal";
import { finanzasService, type Transaccion } from "~/services/finanzasService";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function firstDayOfMonth(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

function lastDayOfMonth(y: number, m: number) {
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RenashopComprasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [compras, setCompras] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    finanzasService
      .getSalidasRenashop(firstDayOfMonth(year, month), lastDayOfMonth(year, month))
      .then(setCompras)
      .catch(() => {
        toast.error("Error al cargar compras de Renashop");
        setCompras([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const totalMes = compras.reduce((sum, t) => sum + t.monto, 0);

  const handleDelete = async (tx: Transaccion) => {
    if (!confirm(`¿Eliminar compra "${tx.descripcion}" por S/ ${formatMoney(tx.monto)}?`)) return;
    try {
      await finanzasService.eliminar(tx.id);
      toast.success("Compra eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const handleExportCSV = () => {
    const headers = "Fecha,Descripción,Persona,Método,Monto (S/)\n";
    const rows = compras.map((t) =>
      [t.fecha, `"${t.descripcion}"`, `"${t.persona ?? ""}"`, t.metodo_pago ?? "", t.monto.toFixed(2)].join(","),
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `renashop-compras-${MESES[month - 1]}-${year}.csv`;
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
            Compras / Salidas — Renashop
          </h1>
          <p className="text-gray-600 mt-1">Estas salidas se descuentan automáticamente del capital Renashop.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={compras.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => { setEditingTx(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nueva compra
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
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
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
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando compras...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Detalle de compras — {compras.length} registro(s)</span>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Total: S/ {formatMoney(totalMes)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compras.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No hay compras registradas este mes</p>
                <Button size="sm" className="mt-4 bg-red-500 hover:bg-red-600" onClick={() => { setEditingTx(null); setModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Registrar compra
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Persona</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-[90px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compras.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.fecha}</TableCell>
                        <TableCell className="font-medium">{t.descripcion}</TableCell>
                        <TableCell>{t.persona?.trim() || "—"}</TableCell>
                        <TableCell className="capitalize">{t.metodo_pago || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">S/ {formatMoney(t.monto)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingTx(t); setModalOpen(true); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(t)}>
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
      )}

      <AddRenashopCompraModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={load} editData={editingTx} />
    </div>
  );
}
