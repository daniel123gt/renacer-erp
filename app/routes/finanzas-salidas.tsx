import type { Route } from "./+types/finanzas-salidas";
import SalidasPage from "~/dashboard/finanzas/salidas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Salidas | ${getAppName()}` }];
}

export default function SalidasRoute() {
  return <SalidasPage />;
}
