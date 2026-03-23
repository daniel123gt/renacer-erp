import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { useAuthStore } from "~/store/authStore";
import {
  BarChart3,
  Settings,
  ArrowRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
  Store,
} from "lucide-react";
import { getAppName } from "~/lib/erpBranding";
import { finanzasService, type BalanceMensual } from "~/services/finanzasService";
import { SaldoDesgloseCard } from "~/components/ui/saldo-desglose-card";
import { personasService, type Persona } from "~/services/personasService";
import { BirthdayCalendar } from "~/components/ui/birthday-calendar";

function formatMoney(n: number): string {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Lunes = 0 … Domingo = 6 */
function mondayBasedWeekday(d: Date): number {
  const sun = d.getDay();
  return sun === 0 ? 6 : sun - 1;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function buildBirthdayMapForMonth(
  personas: Persona[],
  year: number,
  monthIndex0: number
): Map<number, Persona[]> {
  const month1to12 = monthIndex0 + 1;
  const maxDay = daysInMonth(year, monthIndex0);
  const map = new Map<number, Persona[]>();
  for (const p of personas) {
    if (p.cumple_mes !== month1to12 || p.cumple_dia == null) continue;
    const d = p.cumple_dia;
    if (d < 1 || d > maxDay) continue;
    const list = map.get(d) ?? [];
    list.push(p);
    map.set(d, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }
  return map;
}

const quickAccess = [
  {
    title: "Finanzas",
    description: "Registra ingresos y egresos de la iglesia",
    icon: Wallet,
    url: "/finanzas",
    iconBg: "bg-primary-blue/10",
    iconColor: "text-primary-blue",
  },
  {
    title: "Renashop",
    description: "Gestiona la tienda, ventas e inventario",
    icon: Store,
    url: "/renashop",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Reportes",
    description: "Consulta reportes y estadísticas",
    icon: BarChart3,
    url: "/reportes",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    title: "Configuración",
    description: "Ajustes generales del sistema",
    icon: Settings,
    url: "/configuracion",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-700",
  },
];

export default function HomeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  const now = new Date();
  const [balance, setBalance] = useState<BalanceMensual | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [personasCumple, setPersonasCumple] = useState<Persona[]>([]);
  const [loadingCumples, setLoadingCumples] = useState(true);

  useEffect(() => {
    setLoadingBalance(true);
    finanzasService
      .getBalanceMensual(now.getFullYear(), now.getMonth() + 1)
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setLoadingBalance(false));
  }, []);

  useEffect(() => {
    setLoadingCumples(true);
    personasService
      .listActivos()
      .then((list) =>
        setPersonasCumple(
          list.filter(
            (p) =>
              p.cumple_dia != null &&
              p.cumple_mes != null &&
              p.cumple_mes >= 1 &&
              p.cumple_mes <= 12 &&
              p.cumple_dia >= 1 &&
              p.cumple_dia <= 31
          )
        )
      )
      .catch(() => setPersonasCumple([]))
      .finally(() => setLoadingCumples(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-blue">{getAppName()}</h1>
        <p className="text-gray-600 mt-2">Bienvenido(a), {userName}</p>
      </div>

      {/* Resumen financiero del mes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Balance {MESES[now.getMonth()]} {now.getFullYear()}
        </h2>
        {loadingBalance ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-blue" />
          </div>
        ) : balance ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700">Entradas</p>
                    <p className="text-xl font-bold text-green-800 mt-1">
                      S/ {formatMoney(balance.totalEntradas)}
                    </p>
                  </div>
                  <TrendingUp className="w-7 h-7 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-700">Salidas</p>
                    <p className="text-xl font-bold text-red-800 mt-1">
                      S/ {formatMoney(balance.totalSalidas)}
                    </p>
                  </div>
                  <TrendingDown className="w-7 h-7 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <SaldoDesgloseCard balance={balance} formatMoney={formatMoney} variant="compact" />
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-gray-500 text-sm">
              No se pudo cargar el resumen financiero
            </CardContent>
          </Card>
        )}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <Card
              key={item.url}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(item.url)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-blue transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mt-3">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendario de cumpleaños (react-big-calendar) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Cumpleaños</h2>
        <Card>
          <CardContent className="pt-6 pb-5">
            <BirthdayCalendar
              personas={personasCumple}
              loading={loadingCumples}
              onNuevaPersona={() => navigate("/personas")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
