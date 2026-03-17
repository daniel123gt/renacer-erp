import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary-blue" />
          Reportes
        </h1>
        <p className="text-gray-600 mt-1">
          Consulta reportes y estadísticas de la iglesia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Los reportes estarán disponibles pronto</p>
            <p className="text-sm mt-2">
              Aquí podrás consultar estadísticas de inventario y otros datos relevantes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
