import type { Route } from "./+types/finanzas-promesas";
import PromesasPage from "~/dashboard/finanzas/promesas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Promesas | ${getAppName()}` }];
}

export default function PromesasRoute() {
  return <PromesasPage />;
}
