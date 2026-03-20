/**
 * Escribe public/version.json con un identificador único de build.
 * Sincroniza theme_color del manifest PWA con app/erp-branding.config.json.
 * Se ejecuta antes de "npm run build". En CI suele existir VERCEL_GIT_COMMIT_SHA,
 * GITHUB_SHA, etc.; si no, se usa timestamp.
 * (Este script está en tools/ para que se suba a Git; scripts/ está en .gitignore.)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const outPath = join(publicDir, "version.json");
const brandingPath = join(root, "app", "erp-branding.config.json");
const manifestPath = join(publicDir, "manifest.webmanifest");

const version =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  `build-${Date.now()}`;

try {
  mkdirSync(publicDir, { recursive: true });
} catch (_) {}
writeFileSync(outPath, JSON.stringify({ version }, null, 2), "utf8");
console.log("Build version written:", version);

if (existsSync(brandingPath) && existsSync(manifestPath)) {
  try {
    const branding = JSON.parse(readFileSync(brandingPath, "utf8"));
    const theme =
      branding.themeColor ?? branding.primaryColor ?? "#2a4945";
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.theme_color = theme;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log("manifest.webmanifest theme_color →", theme);
  } catch (e) {
    console.warn("No se pudo sincronizar manifest con branding:", e.message);
  }
}
