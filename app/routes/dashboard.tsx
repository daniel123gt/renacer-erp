import type { Route } from "./+types/dashboard";
import Layout from "~/dashboard/layout";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [
    { title: getAppName() },
    { name: "description", content: "ERP" },
  ];
}

export default function Dashboard() {
  return <Layout />;
}
