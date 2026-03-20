/**
 * Branding del ERP: nombre, colores y logo.
 * Se lee desde app/erp-branding.config.json.
 * Para un nuevo ERP: copia el proyecto, ejecuta tools/create-new-erp.mjs y edita app/erp-branding.config.json (o pásalo por argumentos).
 */

import brandingConfig from "~/erp-branding.config.json";

export interface ErpBrandingConfig {
  appName: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  logoPath: string;
  /** Logo para fondos oscuros (sidebar, login). Si no existe, se usa `logoPath`. Coloca el PNG en `public/`; no lo genera el script de iconos PWA. */
  logoLightPath?: string;
  faviconPath?: string;
  /**
   * Color de la barra del navegador, título de la PWA en Windows y cromado móvil (meta theme-color).
   * Si no se define, se usa primaryColor.
   */
  themeColor?: string;
  /** Variante en modo oscuro del sistema (opcional). Si no hay, se usa themeColor o primaryColor. */
  themeColorDark?: string;
}

const defaultBranding: ErpBrandingConfig = {
  appName: "ERP",
  shortName: "ERP",
  primaryColor: "#1F3666",
  accentColor: "#73CBCF",
  secondaryColor: "#3C5894",
  logoPath: "/logo.png",
  faviconPath: "/icono.png",
};

let cached: ErpBrandingConfig = { ...defaultBranding, ...(brandingConfig as ErpBrandingConfig) };

function loadBranding(): ErpBrandingConfig {
  return cached;
}

/** Nombre completo de la aplicación (títulos, meta). */
export function getAppName(): string {
  return loadBranding().appName;
}

/** Nombre corto (sidebar, logo alt). */
export function getShortName(): string {
  return loadBranding().shortName;
}

/** Color principal (hex). */
export function getPrimaryColor(): string {
  return loadBranding().primaryColor;
}

/** Color de acento (hex). */
export function getAccentColor(): string {
  return loadBranding().accentColor;
}

/** Color secundario (hex). */
export function getSecondaryColor(): string {
  return loadBranding().secondaryColor ?? loadBranding().primaryColor;
}

/** Ruta del logo (sidebar, header). */
export function getLogoPath(): string {
  return loadBranding().logoPath;
}

/** Logo sobre fondo oscuro (menú lateral, pantalla login). Por defecto = logo principal. */
export function getLogoLightPath(): string {
  const b = loadBranding();
  return b.logoLightPath ?? b.logoPath;
}

/** Ruta del favicon. */
export function getFaviconPath(): string {
  return loadBranding().faviconPath ?? loadBranding().logoPath;
}

/** Color OS / barra de título PWA / theme-color (por defecto = verde marca). */
export function getThemeColor(): string {
  const b = loadBranding();
  return b.themeColor ?? b.primaryColor;
}

/** theme-color cuando el usuario tiene modo oscuro (misma marca por defecto). */
export function getThemeColorDark(): string {
  const b = loadBranding();
  return b.themeColorDark ?? b.themeColor ?? b.primaryColor;
}

/** Toda la config (para inyectar estilos o usar en un solo lugar). */
export function getErpBranding(): ErpBrandingConfig {
  return loadBranding();
}

/** Para tests o inyección en runtime (opcional). */
export function setErpBranding(config: ErpBrandingConfig): void {
  cached = config;
}
