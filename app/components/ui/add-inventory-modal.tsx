import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import {
  Plus,
  Package,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";
import type { InventoryItem } from "~/services/inventoryService";

interface AddInventoryModalProps {
  onInventoryAdded: (item: InventoryItem) => void;
}

const categories = [
  "Insumos",
  "Protección",
  "Medicamentos",
  "Vendajes",
  "Limpieza",
  "Equipos",
  "Instrumental",
  "Consumibles"
];

const units = [
  "unidades",
  "pares",
  "tabletas",
  "rollos",
  "botellas",
  "cajas",
  "litros",
  "kg",
  "metros",
  "frascos"
];

const suppliers = [
  "MedSupply S.A.",
  "SafeGloves",
  "PharmaCorp",
  "BandagePro",
  "CleanChem",
  "MedEquip",
  "HealthTech",
  "BioMed Solutions"
];

export function AddInventoryModal({ onInventoryAdded }: AddInventoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: "",
    price: 0,
    supplier: "",
    lastRestocked: new Date().toISOString().split('T')[0],
    expiryDate: "",
    status: "in_stock" as const
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateStatus = (current: number, min: number) => {
    if (current === 0) return "out_of_stock";
    if (current <= min) return "low_stock";
    return "in_stock";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: `INV${Date.now()}`,
      ...formData,
      status: calculateStatus(formData.currentStock, formData.minStock)
    };
    setLoading(true);
    try {
      const result = onInventoryAdded(newItem);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        await result;
      }
      setIsOpen(false);
      setFormData({
        name: "",
        category: "",
        description: "",
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unit: "",
        price: 0,
        supplier: "",
        lastRestocked: new Date().toISOString().split("T")[0],
        expiryDate: "",
        status: "in_stock"
      });
    } finally {
      setLoading(false);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Insumos":
        return "bg-blue-100 text-blue-800";
      case "Protección":
        return "bg-green-100 text-green-800";
      case "Medicamentos":
        return "bg-purple-100 text-purple-800";
      case "Vendajes":
        return "bg-orange-100 text-orange-800";
      case "Limpieza":
        return "bg-gray-100 text-gray-800";
      case "Equipos":
        return "bg-indigo-100 text-indigo-800";
      case "Instrumental":
        return "bg-pink-100 text-pink-800";
      case "Consumibles":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const currentStatus = calculateStatus(formData.currentStock, formData.minStock);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue hover:bg-primary-blue/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            Agregar Nuevo Producto
          </DialogTitle>
          <DialogDescription>
            Complete la información para agregar un nuevo producto al inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary-blue" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Jeringas 10ml"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de Medida *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Seleccionar unidad</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Descripción detallada del producto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Control de Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary-blue" />
                Control de Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Actual *
                </label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange("currentStock", parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo *
                </label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange("minStock", parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Máximo *
                </label>
                <Input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => handleInputChange("maxStock", parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary-blue" />
                Información Comercial
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario (S/) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.supplier}
                    onChange={(e) => handleInputChange("supplier", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary-blue" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Último Restock *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.lastRestocked}
                    onChange={(e) => handleInputChange("lastRestocked", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen del Producto */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary-blue">
                <AlertCircle className="w-5 h-5" />
                Resumen del Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Producto:</p>
                  <p className="font-medium">{formData.name || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categoría:</p>
                  <div className="flex items-center space-x-2">
                    {formData.category && (
                      <Badge className={getCategoryColor(formData.category)}>
                        {formData.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock:</p>
                  <p className="font-medium">
                    {formData.currentStock} {formData.unit} 
                    {formData.minStock > 0 && ` (Min: ${formData.minStock}, Max: ${formData.maxStock})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio y Estado:</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">S/ {formData.price.toFixed(2)}</span>
                    {getStatusBadge(currentStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor:</p>
                  <p className="font-medium">{formData.supplier || "No seleccionado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total:</p>
                  <p className="font-medium text-green-600">
                    S/ {(formData.currentStock * formData.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Agregar Producto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
