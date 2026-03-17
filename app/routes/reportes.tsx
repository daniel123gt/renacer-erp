import type { Route } from "./+types/reportes";
import ReportesPage from "~/dashboard/reportes/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Reportes | ${getAppName()}` }];
}

export default function ReportesRoute() {
  return <ReportesPage />;
}
