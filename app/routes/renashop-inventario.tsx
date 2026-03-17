import type { Route } from "./+types/renashop-inventario";
import InventarioPage from "~/dashboard/inventario/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Inventario Renashop | ${getAppName()}` }];
}

export default function RenashopInventarioRoute() {
  return <InventarioPage />;
}
