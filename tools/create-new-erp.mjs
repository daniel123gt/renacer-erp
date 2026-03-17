#!/usr/bin/env node
/**
 * Crea una copia del ERP base como nuevo proyecto con otra marca (nombre, colores, logo).
 *
 * Uso:
 *   node tools/create-new-erp.mjs <carpeta-destino> [opciones]
 *
 * Opciones:
 *   --name "Nombre del ERP"     Nombre completo (títulos, meta)
 *   --short "Nombre corto"      Nombre corto (sidebar, logo alt). Por defecto: igual que --name
 *   --primary "#1F3666"         Color principal (hex)
 *   --accent "#73CBCF"          Color de acento (hex)
 *   --secondary "#3C5894"      Color secundario (hex, opcional)
 *   --logo "/ruta/logo.svg"     Ruta del logo (por defecto /logo.svg)
 *
 * Ejemplo:
 *   node tools/create-new-erp.mjs ../mi-empresa-erp --name "Mi Empresa ERP" --primary "#2563eb" --accent "#38bdf8"
 *
 * Después: cd <carpeta-destino> && npm install && npm run dev
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "build",
  "dist",
  ".react-router",
  ".cursor",
]);

const EXCLUDE_FILES = new Set([".env", ".env.local", ".env.*.local"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const targetDir = args[0];
  if (!targetDir) {
    console.error("Uso: node tools/create-new-erp.mjs <carpeta-destino> [--name \"...\"] [--primary \"#hex\"] [--accent \"#hex\"] [--short \"...\"] [--secondary \"#hex\"] [--logo \"/path\"]");
    process.exit(1);
  }
  const options = {
    targetDir: path.resolve(process.cwd(), targetDir),
    name: "Mi ERP",
    short: null,
    primary: "#1F3666",
    accent: "#73CBCF",
    secondary: "#3C5894",
    logo: "/logo.svg",
  };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === "--short" && args[i + 1]) {
      options.short = args[++i];
    } else if (args[i] === "--primary" && args[i + 1]) {
      options.primary = args[++i];
    } else if (args[i] === "--accent" && args[i + 1]) {
      options.accent = args[++i];
    } else if (args[i] === "--secondary" && args[i + 1]) {
      options.secondary = args[++i];
    } else if (args[i] === "--logo" && args[i + 1]) {
      options.logo = args[++i];
    }
  }
  if (options.short == null) options.short = options.name;
  return options;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const name = path.basename(src);
    if (EXCLUDE_DIRS.has(name)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const name = path.basename(src);
    if (EXCLUDE_FILES.has(name) || name.startsWith(".env")) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function applyBrandingConfig(targetDir, options) {
  const configPath = path.join(targetDir, "app", "erp-branding.config.json");
  const config = {
    appName: options.name,
    shortName: options.short,
    primaryColor: options.primary,
    accentColor: options.accent,
    secondaryColor: options.secondary,
    logoPath: options.logo,
    faviconPath: options.logo,
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log("  ✓ app/erp-branding.config.json");
}

function applyCssColors(targetDir, options) {
  const cssPath = path.join(targetDir, "app", "app.css");
  let css = fs.readFileSync(cssPath, "utf8");
  const oldPrimary = "#1F3666";
  const oldSecondary = "#3C5894";
  const oldAccent = "#73CBCF";
  const oldAccentHover = "#5BB5B9";
  // Reemplazar en bloque @theme y en :root y scrollbar
  css = css.split(oldPrimary).join(options.primary);
  css = css.split(oldSecondary).join(options.secondary);
  css = css.split(oldAccent).join(options.accent);
  // Hover del scrollbar: un tono más claro del accent (opcional, dejar o derivar)
  if (options.accent !== oldAccent) {
    css = css.split(oldAccentHover).join(options.accent);
  }
  fs.writeFileSync(cssPath, css, "utf8");
  console.log("  ✓ app/app.css (paleta aplicada)");
}

function updatePackageName(targetDir, appName) {
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const slug = appName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  pkg.name = slug || "erp-app";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log("  ✓ package.json (name: " + pkg.name + ")");
}

function main() {
  const options = parseArgs();
  console.log("Creando nuevo ERP en:", options.targetDir);
  console.log("  Nombre:", options.name);
  console.log("  Color principal:", options.primary);
  console.log("  Color acento:", options.accent);

  if (fs.existsSync(options.targetDir)) {
    console.error("La carpeta destino ya existe. Elige otra o bórrala.");
    process.exit(1);
  }

  console.log("\nCopiando proyecto base...");
  copyRecursive(ROOT, options.targetDir);

  console.log("\nAplicando marca...");
  applyBrandingConfig(options.targetDir, options);
  applyCssColors(options.targetDir, options);
  updatePackageName(options.targetDir, options.name);

  console.log("\nListo. Siguiente:");
  console.log("  cd " + path.relative(process.cwd(), options.targetDir) + " && npm install && npm run dev");
  console.log("\nOpcional: sustituye public/logo.svg por tu logo y ajusta app/erp-branding.config.json (logoPath) si usas otra ruta.");
}

main();
