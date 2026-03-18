import type { Route } from "./+types/personas";
import PersonasPage from "~/dashboard/personas/Page";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [{ title: `Personas | ${getAppName()}` }];
}

export default function PersonasRoute() {
  return <PersonasPage />;
}
