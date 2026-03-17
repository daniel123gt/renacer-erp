import type { Route } from "./+types/renashop-reportes";
import ReportesRenashopPage from "~/dashboard/renashop/reportes/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Reportes Renashop | ${getAppName()}` }];
}

export default function RenashopReportesRoute() {
  return <ReportesRenashopPage />;
}
