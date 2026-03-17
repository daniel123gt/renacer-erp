import type { Route } from "./+types/mi-perfil";
import MiPerfilPage from "~/dashboard/mi-perfil/MiPerfilPage";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Mi perfil | ${getAppName()}` },
    { name: "description", content: "Información y configuración de tu cuenta" },
  ];
}

export default function MiPerfilRoute() {
  return <MiPerfilPage />;
}
