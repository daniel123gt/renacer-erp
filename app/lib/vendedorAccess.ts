import { isVendedor, VENDEDOR_VENTAS_PATH, type User } from "~/store/authStore";

export { VENDEDOR_VENTAS_PATH };

/** Ruta permitida para el rol vendedor (pantalla única). */
export function vendedorCanAccessPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const allowed = VENDEDOR_VENTAS_PATH.replace(/\/$/, "");
  return p === allowed;
}

export function shouldRedirectVendedorAway(user: User | null, pathname: string): boolean {
  return isVendedor(user) && !vendedorCanAccessPath(pathname);
}
