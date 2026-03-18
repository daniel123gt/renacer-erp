import type { Route } from "./+types/actividad-detalle";
import ActividadDetallePage from "~/dashboard/actividades/detalle/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Detalle Actividad | ${getAppName()}` }];
}

export default function ActividadDetalleRoute() {
  return <ActividadDetallePage />;
}
