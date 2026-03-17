import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AddInventoryModal } from "~/components/ui/add-inventory-modal";
import { ViewInventoryModal } from "~/components/ui/view-inventory-modal";
import { EditInventoryModal } from "~/components/ui/edit-inventory-modal";
import { TablePagination } from "~/components/ui/table-pagination";
import { inventoryService, type InventoryItem } from "~/services/inventoryService";
import { normalizeSearchText } from "~/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Minus,
  Loader2,
} from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    inventoryService
      .list()
      .then(setInventory)
      .catch((err) => {
        console.error(err);
        toast.error("Error al cargar el inventario");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const search = normalizeSearchText(searchTerm);
    const matchesSearch =
      normalizeSearchText(item.name).includes(search) ||
      normalizeSearchText(item.description ?? "").includes(search) ||
      normalizeSearchText(item.id).includes(search);
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFiltered = filteredInventory.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const from = (page - 1) * limit;
  const paginatedRows = filteredInventory.slice(from, from + limit);

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Ir a página 1 cuando cambian filtros o búsqueda (evita quedarse en una página vacía)
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const handleInventoryAdded = async (newItem: InventoryItem) => {
    const { id: _id, ...rest } = newItem;
    try {
      const created = await inventoryService.create(rest);
      setInventory((prev) => [created, ...prev]);
      toast.success("Producto agregado al inventario");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Error al agregar el producto");
      throw err;
    }
  };

  const handleInventoryUpdated = async (updatedItem: InventoryItem) => {
    try {
      const updated = await inventoryService.update(updatedItem);
      setInventory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success("Producto actualizado");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Error al actualizar el producto");
      throw err;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-100 text-green-800">En Stock</Badge>;
      case "low_stock":
        return <Badge className="bg-yellow-100 text-yellow-800">Stock Bajo</Badge>;
      case "out_of_stock":
        return <Badge className="bg-red-100 text-red-800">Sin Stock</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800">Expirado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStockIndicator = (current: number, min: number) => {
    if (current === 0) {
      return <Minus className="w-4 h-4 text-red-600" />;
    } else if (current <= min) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <Package className="w-4 h-4 text-green-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Bebidas":
        return "bg-blue-100 text-blue-800";
      case "Snacks":
        return "bg-amber-100 text-amber-800";
      case "Comida":
        return "bg-green-100 text-green-800";
      case "Dulces":
        return "bg-pink-100 text-pink-800";
      case "Otros":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalItems = inventory.length;
  const inStockItems = inventory.filter((i) => i.status === "in_stock").length;
  const lowStockItems = inventory.filter((i) => i.status === "low_stock").length;
  const outOfStockItems = inventory.filter(
    (i) => i.status === "out_of_stock"
  ).length;
  const totalValue = inventory.reduce(
    (acc, item) => acc + item.currentStock * item.price,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Inventario — Renashop</h1>
          <p className="text-gray-600 mt-2">Gestión de productos y stock de la tienda</p>
        </div>
        <AddInventoryModal onInventoryAdded={handleInventoryAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En Stock</p>
                <p className="text-2xl font-bold text-gray-900">{inStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">S/ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, descripción o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todas las categorías</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Snacks">Snacks</option>
              <option value="Comida">Comida</option>
              <option value="Dulces">Dulces</option>
              <option value="Otros">Otros</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">Todos los estados</option>
              <option value="in_stock">En Stock</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="out_of_stock">Sin Stock</option>
              <option value="expired">Expirado</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Último Restock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="whitespace-nowrap sticky right-0 bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <p className="text-xs text-gray-400">ID: {item.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStockIndicator(item.currentStock, item.minStock)}
                      <div>
                        <p className="font-medium">{item.currentStock} {item.unit}</p>
                        <p className="text-sm text-gray-500">
                          Min: {item.minStock} | Max: {item.maxStock}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">S/ {item.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{item.supplier}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {item.lastRestocked
                          ? new Date(item.lastRestocked).toLocaleDateString("es-ES")
                          : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="sticky right-0 bg-background shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex space-x-2">
                      <ViewInventoryModal item={item} />
                      <EditInventoryModal 
                        item={item} 
                        onInventoryUpdated={handleInventoryUpdated} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
          )}
          {!loading && (
            <TablePagination
              page={page}
              limit={limit}
              total={totalFiltered}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              itemLabel="productos"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
