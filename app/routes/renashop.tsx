import type { Route } from "./+types/renashop";
import RenashopPage from "~/dashboard/renashop/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Renashop | ${getAppName()}` }];
}

export default function RenashopRoute() {
  return <RenashopPage />;
}
