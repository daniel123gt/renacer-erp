/**
 * Envía un Web Push de prueba a todas las suscripciones guardadas.
 *
 * Secrets requeridos:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (ej. "mailto:admin@tudominio.com")
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { broadcastWebPush } from "../_shared/webPushBroadcast.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const payload = {
      title: String(body?.title ?? "Renacer ERP"),
      body: String(body?.body ?? "Esta es una notificación de prueba (Web Push)."),
      url: String(body?.url ?? "/"),
      icon: String(body?.icon ?? "/icons/icon-192.png"),
      badge: String(body?.badge ?? "/icons/icon-192.png"),
      tag: String(body?.tag ?? "renacer-push-test"),
    };

    const result = await broadcastWebPush(supabase, payload);
    if (result.skipped) {
      return new Response(JSON.stringify({ ok: false, error: result.reason }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, total: result.total, sent: result.sent, failed: result.failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
