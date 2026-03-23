import type { Route } from "./+types/setup-password";
import SetupPasswordPage from "../auth/SetupPasswordPage";
import { getAppName } from "~/lib/erpBranding";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `Configurar contraseña | ${getAppName()}` },
    { name: "description", content: "Completar acceso por invitación" },
  ];
}

export default function SetupPasswordRoute() {
  return <SetupPasswordPage />;
}
