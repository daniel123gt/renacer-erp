import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { appConfigService } from "~/services/appConfigService";
import {
  Settings,
  User,
  Shield,
  Database,
  Bell,
  Palette,
  Globe,
  Key,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";

interface SystemConfig {
  id: string;
  category: string;
  name: string;
  value: string;
  type: "text" | "number" | "boolean" | "select";
  description: string;
  required: boolean;
}

const mockConfigs: SystemConfig[] = [
  {
    id: "1",
    category: "General",
    name: "Nombre del Sistema",
    value: "Renacer",
    type: "text",
    description: "Nombre que aparece en el sistema",
    required: true
  },
  {
    id: "2",
    category: "General",
    name: "Versión",
    value: "1.0.0",
    type: "text",
    description: "Versión actual del sistema",
    required: true
  },
  {
    id: "3",
    category: "General",
    name: "Zona Horaria",
    value: "America/Lima",
    type: "select",
    description: "Zona horaria del sistema",
    required: true
  },
  {
    id: "4",
    category: "Seguridad",
    name: "Tiempo de Sesión",
    value: "8",
    type: "number",
    description: "Horas de inactividad antes de cerrar sesión",
    required: true
  },
  {
    id: "5",
    category: "Seguridad",
    name: "Requerir 2FA",
    value: "false",
    type: "boolean",
    description: "Requerir autenticación de dos factores",
    required: false
  },
  {
    id: "6",
    category: "Notificaciones",
    name: "Email de Notificaciones",
    value: "contacto@renacer.church",
    type: "text",
    description: "Email para envío de notificaciones",
    required: true
  },
  {
    id: "7",
    category: "Notificaciones",
    name: "Notificaciones Push",
    value: "true",
    type: "boolean",
    description: "Habilitar notificaciones push",
    required: false
  },
  {
    id: "8",
    category: "Base de Datos",
    name: "Backup Automático",
    value: "true",
    type: "boolean",
    description: "Realizar backup automático diario",
    required: false
  },
  {
    id: "9",
    category: "Base de Datos",
    name: "Retención de Backups",
    value: "30",
    type: "number",
    description: "Días de retención de backups",
    required: true
  }
];

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>(mockConfigs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [cuotaAlquiler, setCuotaAlquiler] = useState<string>("275");
  const [loadingCuota, setLoadingCuota] = useState(true);
  const [savingCuota, setSavingCuota] = useState(false);

  useEffect(() => {
    let ok = true;
    setLoadingCuota(true);
    appConfigService
      .getCuotaAlquiler()
      .then((n) => {
        if (ok) setCuotaAlquiler(String(n));
      })
      .catch(() => {
        if (ok) toast.error("No se pudo cargar la cuota de alquiler");
      })
      .finally(() => {
        if (ok) setLoadingCuota(false);
      });
    return () => {
      ok = false;
    };
  }, []);

  const handleGuardarCuota = async () => {
    const n = parseFloat(cuotaAlquiler.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Ingresa un monto válido mayor a 0");
      return;
    }
    setSavingCuota(true);
    try {
      await appConfigService.setCuotaAlquiler(n);
      toast.success("Cuota de alquiler guardada");
    } catch {
      toast.error("Error al guardar la cuota");
    } finally {
      setSavingCuota(false);
    }
  };

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || config.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (config: SystemConfig) => {
    setEditingId(config.id);
    setEditValue(config.value);
  };

  const handleSave = (id: string) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, value: editValue } : config
    ));
    setEditingId(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleExportConfig = () => {
    try {
      const configData = {
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        configurations: configs
      };
      
      const jsonString = JSON.stringify(configData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracion-sistema-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Configuración exportada exitosamente");
    } catch (error) {
      toast.error("Error al exportar la configuración");
      console.error("Error:", error);
    }
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target?.result as string);
            if (importedData.configurations && Array.isArray(importedData.configurations)) {
              setConfigs(importedData.configurations);
              toast.success("Configuración importada exitosamente");
            } else {
              toast.error("Formato de archivo inválido");
            }
          } catch (error) {
            toast.error("Error al leer el archivo");
            console.error("Error:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSaveChanges = () => {
    try {
      // Guardar en localStorage
      localStorage.setItem('systemConfig', JSON.stringify(configs));
      
      // Simular guardado en servidor
      setTimeout(() => {
        toast.success("Cambios guardados exitosamente");
      }, 500);
    } catch (error) {
      toast.error("Error al guardar los cambios");
      console.error("Error:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "General":
        return "bg-blue-100 text-blue-800";
      case "Seguridad":
        return "bg-red-100 text-red-800";
      case "Notificaciones":
        return "bg-green-100 text-green-800";
      case "Base de Datos":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderConfigValue = (config: SystemConfig) => {
    if (editingId === config.id) {
      if (config.type === "boolean") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );
      } else if (config.type === "select") {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="America/Lima">America/Lima</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/Madrid">Europe/Madrid</option>
          </select>
        );
      } else {
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-32"
          />
        );
      }
    } else {
      if (config.type === "boolean") {
        return (
          <Badge className={config.value === "true" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {config.value === "true" ? "Sí" : "No"}
          </Badge>
        );
      } else {
        return <span className="font-medium">{config.value}</span>;
      }
    }
  };

  const renderActions = (config: SystemConfig) => {
    if (editingId === config.id) {
      return (
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => handleSave(config.id)}>
            <Save className="w-3 h-3 mr-1" />
            Guardar
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      );
    } else {
      return (
        <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
          <Settings className="w-3 h-3 mr-1" />
          Editar
        </Button>
      );
    }
  };

  const categories = Array.from(new Set(configs.map(c => c.category)));

  return (
    <div className="space-y-6">
      <Card className="border-primary-blue/20 bg-primary-blue/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Finanzas y alertas (servidor)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>Cuota de alquiler (S/)</strong> se usa para las notificaciones automáticas los{" "}
            <strong>jueves desde las 16:00</strong> (hora Lima): si el saldo del mes es menor que esta
            cuota, se registra una alerta cada hora. Valor por defecto: 275.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="cuota-alquiler" className="text-xs font-medium text-gray-500 block mb-1">
                Cuota alquiler (S/)
              </label>
              <Input
                id="cuota-alquiler"
                type="text"
                inputMode="decimal"
                className="w-40"
                disabled={loadingCuota || savingCuota}
                value={cuotaAlquiler}
                onChange={(e) => setCuotaAlquiler(e.target.value)}
              />
            </div>
            <Button onClick={() => void handleGuardarCuota()} disabled={loadingCuota || savingCuota}>
              {savingCuota ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar cuota
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-blue">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-2">Administra la configuración general del ERP</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Config
          </Button>
          <Button variant="outline" onClick={handleImportConfig}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Config
          </Button>
          <Button onClick={handleSaveChanges}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-800">Configuraciones</h3>
            <p className="text-3xl font-bold text-blue-900">{configs.length}</p>
            <p className="text-sm text-blue-600 mt-2">Parámetros del sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800">Seguridad</h3>
            <p className="text-3xl font-bold text-green-900">
              {configs.filter(c => c.category === "Seguridad").length}
            </p>
            <p className="text-sm text-green-600 mt-2">Configuraciones de seguridad</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <Database className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-purple-800">Base de Datos</h3>
            <p className="text-3xl font-bold text-purple-900">
              {configs.filter(c => c.category === "Base de Datos").length}
            </p>
            <p className="text-sm text-purple-600 mt-2">Configuraciones de BD</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 text-orange-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-orange-800">Notificaciones</h3>
            <p className="text-3xl font-bold text-orange-900">
              {configs.filter(c => c.category === "Notificaciones").length}
            </p>
            <p className="text-sm text-orange-600 mt-2">Configuraciones de alertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar configuraciones..."
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
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Configuraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConfigs.map((config) => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getCategoryColor(config.category)}>
                        {config.category}
                      </Badge>
                      {config.required && (
                        <Badge className="bg-red-100 text-red-800">Requerido</Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {renderConfigValue(config)}
                    </div>
                    {renderActions(config)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
