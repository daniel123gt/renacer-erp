import type { Route } from "./+types/auth";
import AuthPage from "../auth/Page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Iniciar sesión | Renacer" },
    { name: "description", content: "Acceso al ERP" },
  ];
}

export default function AuthRoute() {
  return <AuthPage />;
}
