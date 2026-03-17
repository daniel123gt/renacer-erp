import type { Route } from "./+types/finanzas-ofrendas";
import OfrendasPage from "~/dashboard/finanzas/ofrendas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Ofrendas | ${getAppName()}` }];
}

export default function OfrendasRoute() {
  return <OfrendasPage />;
}
