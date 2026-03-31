import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/auth.tsx"),
  route("configurar-contrasena", "routes/setup-password.tsx"),
  route('/', 'routes/dashboard.tsx', [
    index('routes/home.tsx'),
    route('finanzas', 'routes/finanzas.tsx'),
    route('finanzas/ofrendas', 'routes/finanzas-ofrendas.tsx'),
    route('finanzas/promesas', 'routes/finanzas-promesas.tsx'),
    route('finanzas/salidas', 'routes/finanzas-salidas.tsx'),
    route('renashop', 'routes/renashop.tsx'),
    route('renashop/ventas', 'routes/renashop-ventas.tsx'),
    route('renashop/compras', 'routes/renashop-compras.tsx'),
    route('renashop/inventario', 'routes/renashop-inventario.tsx'),
    route('renashop/reportes', 'routes/renashop-reportes.tsx'),
    route('personas', 'routes/personas.tsx'),
    route('actividades', 'routes/actividades.tsx'),
    route('actividades/:id', 'routes/actividad-detalle.tsx'),
    route('reportes', 'routes/reportes.tsx'),
    route('configuracion', 'routes/configuracion.tsx'),
    route('mi-perfil', 'routes/mi-perfil.tsx'),
  ]),
] satisfies RouteConfig;
