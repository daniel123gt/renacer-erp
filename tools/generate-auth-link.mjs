/**
 * Genera un enlace de recuperación / invitación SIN enviar correo por Supabase
 * (útil cuando aparece "email rate limit exceeded").
 *
 * Uso:
 *   1. En .env (solo en tu máquina, NUNCA subas la service role a git):
 *      SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
 *      AUTH_REDIRECT_TO=https://TU-DOMINIO.vercel.app/configurar-contrasena
 *      (o APP_BASE_URL=https://TU-DOMINIO.vercel.app y se añade /configurar-contrasena)
 *   2. Ejecutar:
 *      npm run auth:link -- usuario@correo.com
 *      npm run auth:link -- usuario@correo.com recovery
 *      npm run auth:link -- usuario@correo.com invite
 *
 * Tipos:
 *   recovery — usuario YA existe en Auth (olvidó contraseña / completar acceso).
 *   invite   — usuario NUEVO (aún no aparece en Authentication).
 *   magiclink — inicio con enlace mágico (usuario debe existir según políticas).
 * Copia el enlace y envíaselo por WhatsApp / correo manual.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");

function loadDotenv() {
  if (!existsSync(envPath)) return;
  let raw = readFileSync(envPath, "utf8");
  // Evita que la primera clave falle en Windows si el archivo tiene BOM UTF-8
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (let line of raw.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotenv();

const ALLOWED_TYPES = new Set(["recovery", "invite", "magiclink"]);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRole =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY;
const email = process.argv[2]?.trim();
let type = (process.argv[3] || "recovery").trim().toLowerCase();

if (!email) {
  console.error("Uso: npm run auth:link -- <email> [recovery|invite|magiclink]");
  process.exit(1);
}

if (!ALLOWED_TYPES.has(type)) {
  console.error(`Tipo inválido "${type}". Usa: recovery, invite o magiclink`);
  process.exit(1);
}

if (!supabaseUrl) {
  console.error(
    "No se encontró la URL del proyecto. Añade en .env:\n" +
      "  VITE_SUPABASE_URL=https://TU-REF.supabase.co"
  );
  if (!existsSync(envPath)) {
    console.error(`(No existe el archivo: ${envPath})`);
  }
  process.exit(1);
}

if (!serviceRole) {
  console.error(
    "Falta la clave secreta de servicio en .env. Añade UNA línea (no uses prefijo VITE_):\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n\n" +
      "Dónde copiarla: Supabase Dashboard → Project Settings → API → service_role (Reveal).\n" +
      "Nunca subas esta clave a Git ni la expongas en el frontend."
  );
  process.exit(1);
}

const fullRedirect =
  process.env.AUTH_REDIRECT_TO?.trim() ||
  (() => {
    const base = (
      process.env.APP_BASE_URL ||
      process.env.VITE_APP_URL ||
      process.env.SITE_URL ||
      ""
    ).trim().replace(/\/$/, "");
    if (!base) return "";
    return `${base}/configurar-contrasena`;
  })();

if (!fullRedirect) {
  console.error(
    "Define AUTH_REDIRECT_TO con la URL completa, por ejemplo:\n" +
      "  AUTH_REDIRECT_TO=https://tu-app.vercel.app/configurar-contrasena\n" +
      "o APP_BASE_URL=https://tu-app.vercel.app (se añade /configurar-contrasena)"
  );
  console.error(
    "Esa URL debe estar en Supabase → Authentication → URL Configuration → Redirect URLs."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type,
  email,
  options: { redirectTo: fullRedirect },
});

if (error) {
  console.error("Error de Supabase:", error.message);
  const msg = error.message || "";
  if (/not found/i.test(msg) && type === "recovery") {
    console.error(
      "\n→ `recovery` solo sirve si ese correo YA está en Usuarios (Authentication).\n" +
        "  Si aún no existe el usuario (nunca se creó o falló el correo de invitación), usa invitación:\n\n" +
        `    npm run auth:link -- ${email} invite\n\n` +
        "  O créalo en Supabase → Authentication → Users → Invite user, y luego vuelve a usar recovery."
    );
  }
  if (/already been registered|already registered|User already exists/i.test(msg) && type === "invite") {
    console.error(
      "\n→ Ese correo ya tiene cuenta. Prueba enlace de recuperación de contraseña:\n\n" +
        `    npm run auth:link -- ${email} recovery\n`
    );
  }
  process.exit(1);
}

const link = data?.properties?.action_link;
if (!link) {
  console.error("Respuesta inesperada (sin action_link):", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("\n--- Enlace (cópialo y envíalo al usuario) ---\n");
console.log(link);
console.log("\n--- Fin ---\n");
console.log(`Tipo: ${type} | Redirige a: ${fullRedirect}`);
