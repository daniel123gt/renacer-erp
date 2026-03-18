import type { Route } from "./+types/actividades";
import ActividadesPage from "~/dashboard/actividades/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Actividades | ${getAppName()}` }];
}

export default function ActividadesRoute() {
  return <ActividadesPage />;
}
