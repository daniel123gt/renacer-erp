import type { Route } from "./+types/configuracion";
import ConfiguracionPage from "~/dashboard/configuracion/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Configuración | ${getAppName()}` }];
}

export default function ConfiguracionRoute() {
  return <ConfiguracionPage />;
}
