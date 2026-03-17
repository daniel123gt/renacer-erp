import type { Route } from "./+types/home";
import HomeDashboard from "~/dashboard/home/Home";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Inicio | ${getAppName()}` },
    { name: "description", content: "Dashboard principal" },
  ];
}

export default function Home() {
  return <HomeDashboard />;
}
