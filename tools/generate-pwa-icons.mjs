/**
 * Genera PNG para PWA / favicon / logo en public/.
 * Colores desde app/erp-branding.config.json (primaryColor).
 * Ejecutar: node tools/generate-pwa-icons.mjs
 * (También se invoca desde `npm run build`.)
 */
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const brandingPath = path.join(root, "app", "erp-branding.config.json");

function hexToRgb(hex) {
  const h = String(hex).replace("#", "").trim();
  if (h.length !== 6) return { r: 42, g: 73, b: 69 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

let primary = "#2a4945";
try {
  const raw = JSON.parse(fs.readFileSync(brandingPath, "utf8"));
  if (raw.primaryColor) primary = raw.primaryColor;
} catch {
  /* default */
}

const bg = hexToRgb(primary);
/** Cruz / símbolo claro sobre fondo marca */
const fg = { r: 216, g: 223, b: 214 };

function isPlus(x, y, cx, cy, arm, thick) {
  const dx = x - cx;
  const dy = y - cy;
  const hBar = Math.abs(dy) <= thick / 2 && Math.abs(dx) <= arm;
  const vBar = Math.abs(dx) <= thick / 2 && Math.abs(dy) <= arm;
  return hBar || vBar;
}

/** Icono app: fondo sólido + cruz */
function drawAppIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const arm = size * 0.22;
  const thick = Math.max(6, Math.round(size * 0.065));
  const pad = Math.round(size * 0.06);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const inside = x >= pad && x < size - pad && y >= pad && y < size - pad;
      let r = bg.r;
      let g = bg.g;
      let b = bg.b;
      let a = 255;
      if (inside && isPlus(x, y, cx, cy, arm, thick)) {
        r = fg.r;
        g = fg.g;
        b = fg.b;
      }
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  return png;
}

/** Logo claro para sidebar (fondo transparente, solo cruz en color claro) */
function drawLightLogo(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const arm = size * 0.2;
  const thick = Math.max(8, Math.round(size * 0.07));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      if (isPlus(x, y, cx, cy, arm, thick)) {
        png.data[idx] = fg.r;
        png.data[idx + 1] = fg.g;
        png.data[idx + 2] = fg.b;
        png.data[idx + 3] = 255;
      } else {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }
  return png;
}

function writePng(png, filePath) {
  return new Promise((resolve, reject) => {
    png
      .pack()
      .pipe(fs.createWriteStream(filePath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function main() {
  const iconsDir = path.join(root, "public", "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  const tasks = [
    writePng(drawAppIcon(192), path.join(iconsDir, "icon-192.png")),
    writePng(drawAppIcon(512), path.join(iconsDir, "icon-512.png")),
    writePng(drawAppIcon(192), path.join(root, "public", "logo.png")),
    writePng(drawLightLogo(512), path.join(root, "public", "logo-light-large.png")),
  ];
  await Promise.all(tasks);
  console.log("PWA icons + logo.png + logo-light-large.png generados en public/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
