import { Button } from "~/components/ui/button";
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
  Eye, 
  Package, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  AlertCircle,
  Building2,
  Minus,
  Plus as PlusIcon,
  Clock,
} from "lucide-react";
import type { InventoryItem } from "~/services/inventoryService";

interface ViewInventoryModalProps {
  item: InventoryItem;
}

export function ViewInventoryModal({ item }: ViewInventoryModalProps) {
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

  const getStockIndicator = (current: number, min: number) => {
    if (current === 0) {
      return <Minus className="w-5 h-5 text-red-600" />;
    } else if (current <= min) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else {
      return <Package className="w-5 h-5 text-green-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = () => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate) < new Date();
  };

  const getStockPercentage = () => {
    if (item.maxStock === 0) return 0;
    return Math.min((item.currentStock / item.maxStock) * 100, 100);
  };

  const getStockLevel = () => {
    if (item.currentStock === 0) return "Sin Stock";
    if (item.currentStock <= item.minStock) return "Stock Bajo";
    if (item.currentStock >= item.maxStock * 0.8) return "Stock Alto";
    return "Stock Normal";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary-blue">
            {item.name}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del producto en inventario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header con Estado */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-blue/10 rounded-full">
                    <Package className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary-blue">
                      {item.name}
                    </h3>
                    <p className="text-gray-600">ID: {item.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStockIndicator(item.currentStock, item.minStock)}
                  {getStatusBadge(item.status)}
                  {isExpired() && (
                    <Badge className="bg-red-100 text-red-800">Expirado</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary-blue" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <p className="text-gray-900">{item.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida
                    </label>
                    <p className="font-medium">{item.unit}</p>
                  </div>
                </div>
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
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Stock Actual</p>
                    <p className="text-2xl font-bold text-green-600">
                      {item.currentStock} {item.unit}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Stock Mínimo</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {item.minStock} {item.unit}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Stock Máximo</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {item.maxStock} {item.unit}
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Nivel de Stock</span>
                    <span className="text-sm text-gray-500">{getStockLevel()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        item.currentStock === 0 ? 'bg-red-500' :
                        item.currentStock <= item.minStock ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${getStockPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getStockPercentage().toFixed(1)}% del stock máximo
                  </p>
                </div>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Precio Unitario</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    S/ {(item.currentStock * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{item.supplier}</span>
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
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Último Restock</p>
                  <p className="font-medium">{formatDate(item.lastRestocked)}</p>
                </div>
                {item.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                    <p className={`font-medium ${isExpired() ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(item.expiryDate)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historial de Movimientos (Mock) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary-blue" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Producto agregado al inventario</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.lastRestocked)} - Sistema
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <PlusIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+{item.currentStock}</span>
                  </div>
                </div>
                {item.currentStock < item.maxStock && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Restock recomendado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.lastRestocked)} - Sistema
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        +{item.maxStock - item.currentStock}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alertas y Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-primary-blue" />
                Alertas y Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {item.currentStock === 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">¡Stock Agotado!</p>
                      <p className="text-xs text-red-600">Se requiere restock urgente</p>
                    </div>
                  </div>
                )}
                {item.currentStock > 0 && item.currentStock <= item.minStock && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Stock Bajo</p>
                      <p className="text-xs text-yellow-600">Considerar restock pronto</p>
                    </div>
                  </div>
                )}
                {isExpired() && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Producto Expirado</p>
                      <p className="text-xs text-red-600">Retirar del inventario</p>
                    </div>
                  </div>
                )}
                {!item.expiryDate && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Sin Fecha de Vencimiento</p>
                      <p className="text-xs text-blue-600">Producto no perecedero</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
