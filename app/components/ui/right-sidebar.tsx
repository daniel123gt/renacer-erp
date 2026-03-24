import { useState } from "react";
import { useAuthStore, getAppRole, isVendedor } from "~/store/authStore";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getAppName, getLogoPath } from "~/lib/erpBranding";
import { Calendar, Package, Settings, User, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";

type SidebarContentProps = {
  compact?: boolean;
  onNavigate: (path: string) => void;
};

function RightSidebarContent({ compact = false, onNavigate }: SidebarContentProps) {
  const { user } = useAuthStore();
  const role = getAppRole(user);
  const fullName = user?.user_metadata?.full_name || "Usuario";
  const email = user?.email || "";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const contentPadding = compact ? "p-4" : "p-6";

  return (
    <>
      <div className={`${contentPadding} flex flex-col gap-6 flex-1 overflow-y-auto`}>
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
            onClick={() => onNavigate("/mi-perfil")}
          >
            <User className="w-4 h-4 mr-2" />
            Datos y configuración
          </Button>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Accesos rapidos
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onNavigate("/finanzas")}
            >
              <Wallet className="w-4 h-4 mr-2 text-primary-blue" />
              Finanzas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onNavigate("/renashop")}
            >
              <Package className="w-4 h-4 mr-2 text-amber-500" />
              Renashop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onNavigate("/configuracion")}
            >
              <Settings className="w-4 h-4 mr-2 text-gray-600" />
              Configuración
            </Button>
          </div>
        </div>
      </div>

      <div className={`${compact ? "p-3" : "p-4"} border-t border-gray-200 bg-gray-50`}>
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
    </>
  );
}

export function MobileRightSidebarButton() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user || isVendedor(user)) return null;

  const fullName = user.user_metadata?.full_name || "Usuario";
  const initial = (fullName.charAt(0) || user.email.charAt(0) || "U").toUpperCase();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-[66px] h-[66px] rounded-full border border-gray-200 bg-white hover:bg-gray-50"
          aria-label="Abrir panel de usuario"
        >
          <span className="w-12 h-12 rounded-full bg-primary-blue text-white text-lg font-semibold flex items-center justify-center">
            {initial}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-[22rem] p-0">
        <SheetHeader className="border-b pb-3">
          <SheetTitle>Panel de usuario</SheetTitle>
        </SheetHeader>
        <RightSidebarContent compact onNavigate={handleNavigate} />
      </SheetContent>
    </Sheet>
  );
}

export function RightSidebar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (user && isVendedor(user)) {
    return null;
  }

  return (
    <aside className="w-72 shrink-0 border-l border-gray-200 bg-white hidden lg:flex flex-col">
      <RightSidebarContent onNavigate={navigate} />
    </aside>
  );
}

