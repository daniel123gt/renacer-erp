/**
 * Iconos PWA: public/icons/icon-192.png e icon-512.png
 *
 * Fuente (prioridad):
 *   1) public/icono.png — icono / favicon oficial (p. ej. marca en fondo claro)
 *   2) public/logo-light-large.png
 *   3) public/logo.png
 *
 * Los iconos se generan sobre fondo blanco (mejor en inicio del SO).
 * NO modifica esos archivos fuente.
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

function readPng(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on("parsed", function () {
        resolve(this);
      })
      .on("error", reject);
  });
}

function blendOverWhite(fr, fg, fb, fa) {
  const a = fa / 255;
  return [
    Math.round(fr * a + 255 * (1 - a)),
    Math.round(fg * a + 255 * (1 - a)),
    Math.round(fb * a + 255 * (1 - a)),
    255,
  ];
}

/** Logo escalado centrado sobre cuadrado blanco (tamaño fijo para PWA). */
function fitLogoOnWhiteSquare(src, size) {
  const dst = new PNG({ width: size, height: size });
  for (let i = 0; i < size * size * 4; i += 4) {
    dst.data[i] = 255;
    dst.data[i + 1] = 255;
    dst.data[i + 2] = 255;
    dst.data[i + 3] = 255;
  }

  const sw = src.width;
  const sh = src.height;
  if (sw < 1 || sh < 1) return dst;

  const scale = Math.min(size / sw, size / sh);
  const nw = Math.max(1, Math.round(sw * scale));
  const nh = Math.max(1, Math.round(sh * scale));
  const ox = Math.floor((size - nw) / 2);
  const oy = Math.floor((size - nh) / 2);

  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x / nw) * sw));
      const sy = Math.min(sh - 1, Math.floor((y / nh) * sh));
      const sidx = (sw * sy + sx) << 2;
      const fr = src.data[sidx];
      const fg = src.data[sidx + 1];
      const fb = src.data[sidx + 2];
      const fa = src.data[sidx + 3];
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dx >= size || dy < 0 || dy >= size) continue;
      const [r, g, b, a] = blendOverWhite(fr, fg, fb, fa);
      const didx = (size * dy + dx) << 2;
      dst.data[didx] = r;
      dst.data[didx + 1] = g;
      dst.data[didx + 2] = b;
      dst.data[didx + 3] = a;
    }
  }
  return dst;
}

function drawSolidIcon(size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx] = bg.r;
      png.data[idx + 1] = bg.g;
      png.data[idx + 2] = bg.b;
      png.data[idx + 3] = 255;
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

function pickSourceLogoPath() {
  const icono = path.join(root, "public", "icono.png");
  const light = path.join(root, "public", "logo-light-large.png");
  const main = path.join(root, "public", "logo.png");
  if (fs.existsSync(icono)) return { path: icono, label: "public/icono.png" };
  if (fs.existsSync(light)) return { path: light, label: "public/logo-light-large.png" };
  if (fs.existsSync(main)) return { path: main, label: "public/logo.png" };
  return null;
}

async function main() {
  const iconsDir = path.join(root, "public", "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  const p192 = path.join(iconsDir, "icon-192.png");
  const p512 = path.join(iconsDir, "icon-512.png");

  const picked = pickSourceLogoPath();
  if (picked) {
    try {
      const src = await readPng(picked.path);
      await Promise.all([
        writePng(fitLogoOnWhiteSquare(src, 192), p192),
        writePng(fitLogoOnWhiteSquare(src, 512), p512),
      ]);
      console.log(`PWA: icon-192 e icon-512 generados desde ${picked.label} (fondo blanco).`);
      return;
    } catch (e) {
      console.warn(`No se pudo leer ${picked.label}:`, e.message);
    }
  }

  const tasks = [];
  if (!fs.existsSync(p192)) {
    tasks.push(writePng(drawSolidIcon(192), p192));
  }
  if (!fs.existsSync(p512)) {
    tasks.push(writePng(drawSolidIcon(512), p512));
  }
  await Promise.all(tasks);
  if (tasks.length > 0) {
    console.log("PWA: iconos de color sólido (añade logo-light-large.png o logo.png).");
  } else {
    console.log("public/icons/: sin cambios.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
