import type { Route } from "./+types/renashop-ventas";
import VentasPage from "~/dashboard/renashop/ventas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Ventas Renashop | ${getAppName()}` }];
}

export default function RenashopVentasRoute() {
  return <VentasPage />;
}
