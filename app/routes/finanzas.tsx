import type { Route } from "./+types/finanzas";
import FinanzasPage from "~/dashboard/finanzas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Finanzas | ${getAppName()}` }];
}

export default function FinanzasRoute() {
  return <FinanzasPage />;
}
