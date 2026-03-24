import { useAuthStore, getAppRole, isVendedor } from "~/store/authStore";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getAppName, getLogoPath } from "~/lib/erpBranding";
import { Calendar, Package, Settings, User, Wallet } from "lucide-react";

export function RightSidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = getAppRole(user);

  if (user && isVendedor(user)) {
    return null;
  }
  const fullName = user?.user_metadata?.full_name || "Usuario";
  const email = user?.email || "";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <aside className="w-72 shrink-0 border-l border-gray-200 bg-white hidden lg:flex flex-col">
      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
        {/* Perfil del usuario */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Perfil del Usuario
          </h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-medium">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{fullName}</p>
              <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent-blue text-primary-blue capitalize">
                {role}
              </span>
            </div>
          </div>
          {createdAt && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Ingreso {createdAt}
            </p>
          )}
          {email && (
            <p className="text-xs text-gray-500 mt-1 truncate" title={email}>
              {email}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => navigate("/mi-perfil")}
          >
            <User className="w-4 h-4 mr-2" />
            Datos y configuración
          </Button>
        </div>

        <Separator />

        {/* Accesos rápidos */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Accesos rápidos
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => navigate("/finanzas")}
            >
              <Wallet className="w-4 h-4 mr-2 text-primary-blue" />
              Finanzas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => navigate("/renashop")}
            >
              <Package className="w-4 h-4 mr-2 text-amber-500" />
              Renashop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => navigate("/configuracion")}
            >
              <Settings className="w-4 h-4 mr-2 text-gray-600" />
              Configuración
            </Button>
          </div>
        </div>
      </div>

      {/* Footer con branding */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <img
            src={getLogoPath()}
            alt={getAppName()}
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <p className="text-sm font-semibold text-primary-blue">{getAppName()}</p>
            <p className="text-xs text-gray-400">Sistema de Gestión</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

