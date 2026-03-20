import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL no está definida en las variables de entorno');
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY no está definida en las variables de entorno');
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