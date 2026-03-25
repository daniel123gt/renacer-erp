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
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PushRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const VAPID_PUBLIC_KEY = (Deno.env.get("VAPID_PUBLIC_KEY") ?? "").trim();
    const VAPID_PRIVATE_KEY = (Deno.env.get("VAPID_PRIVATE_KEY") ?? "").trim();
    const VAPID_SUBJECT = (Deno.env.get("VAPID_SUBJECT") ?? "").trim();
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      throw new Error("Faltan secrets VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT");
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const body = await req.json().catch(() => ({} as any));
    const payload = {
      title: String(body?.title ?? "Renacer ERP"),
      body: String(body?.body ?? "Esta es una notificación de prueba (Web Push)."),
      url: String(body?.url ?? "/"),
      icon: String(body?.icon ?? "/icons/icon-192.png"),
      badge: String(body?.badge ?? "/icons/icon-192.png"),
      tag: String(body?.tag ?? "renacer-push-test"),
    };

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");
    if (error) throw error;
    const subs = (data ?? []) as PushRow[];

    let sent = 0;
    let failed = 0;

    for (const s of subs) {
      try {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };
        await webpush.sendNotification(subscription as any, JSON.stringify(payload));
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, total: subs.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

