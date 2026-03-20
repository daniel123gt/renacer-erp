import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import Loading from "./components/root/Loading/Loading";
import { PwaServiceWorker } from "~/components/PwaServiceWorker";
import { Toaster } from "~/components/ui/sonner";
import { VersionUpdateBanner } from "~/components/VersionUpdateBanner";

import type { Route } from "./+types/root";
import { getFaviconPath, getShortName, getThemeColor, getThemeColorDark } from "~/lib/erpBranding";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/png", href: getFaviconPath() },
  { rel: "manifest", href: "/manifest.webmanifest" },
  /** iPhone / iPad al “Añadir a pantalla de inicio”: Apple recomienda 180×180 PNG. */
  { rel: "apple-touch-icon", href: "/icons/icon-180.png", sizes: "180x180" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Barra del navegador / título PWA (Windows) / cromado Android; alineado a la paleta ERP */}
        <meta name="theme-color" content={getThemeColor()} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={getThemeColorDark()} media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content={getThemeColor()} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/*
          default = barra de estado clara (texto oscuro), encaja si el contenido superior es blanco.
          black-translucent = la web dibuja bajo la hora/batería (mejor con cabecera verde + safe-area).
        */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={getShortName()} />
        <Meta />
        <Links />
      </head>
      <body>
        <Loading />
        <PwaServiceWorker />
        {children}
        <Toaster richColors position="top-center" theme="light" />
        <VersionUpdateBanner />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
