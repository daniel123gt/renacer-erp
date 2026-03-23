import { createClient } from '@supabase/supabase-js';

/**
 * En Vercel, el SSR a veces necesita leer `process.env` en runtime; en el cliente Vite
 * incrusta `import.meta.env.VITE_*` en build (debe ser acceso estático, no dinámico).
 */
function supabaseUrlFromEnv(): string {
  if (typeof process !== "undefined" && process.env.VITE_SUPABASE_URL) {
    return process.env.VITE_SUPABASE_URL;
  }
  return import.meta.env.VITE_SUPABASE_URL || "";
}

function supabaseAnonKeyFromEnv(): string {
  if (typeof process !== "undefined" && process.env.VITE_SUPABASE_ANON_KEY) {
    return process.env.VITE_SUPABASE_ANON_KEY;
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || "";
}

const supabaseUrl = supabaseUrlFromEnv();
const supabaseKey = supabaseAnonKeyFromEnv();

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL no está definida en las variables de entorno");
}

if (!supabaseKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno");
}

/**
 * persistSession + autoRefreshToken: la sesión se guarda (p. ej. localStorage) y el access
 * token se renueva solo mientras el refresh token sea válido (comportamiento tipo “Facebook”).
 * La pantalla “User sessions” de Pro es otra cosa (forzar cierre tras X tiempo).
 */
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void supabase.auth.getSession();
    }
  });
}

export default supabase;