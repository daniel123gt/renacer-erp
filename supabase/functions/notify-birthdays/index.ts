/**
 * Cron recomendado (UTC): 0 11 * * *  → ~06:00 America/Lima (sin DST en Perú)
 * Crea una notificación si hay personas activas que cumplen años ese día en Lima.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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

    const { data: cal, error: calErr } = await supabase.rpc("lima_calendar");
    if (calErr) throw calErr;
    const row = Array.isArray(cal) ? cal[0] : cal;
    if (!row) throw new Error("lima_calendar sin fila");

    const y = row.y as number;
    const m = row.m as number;
    const d = row.d as number;

    const { data: personas, error: pErr } = await supabase
      .from("personas")
      .select("id, nombre")
      .eq("activo", true)
      .eq("cumple_mes", m)
      .eq("cumple_dia", d);

    if (pErr) throw pErr;

    if (!personas?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "Sin cumpleaños hoy", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nombres = personas.map((p) => p.nombre).sort((a, b) => a.localeCompare(b, "es"));
    const dedupe_key = `cumpleanos-${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const titulo = nombres.length === 1 ? "Cumpleaños hoy" : `Cumpleaños hoy (${nombres.length})`;
    const cuerpo =
      nombres.length === 1
        ? `Hoy cumple años: ${nombres[0]}.`
        : `Hoy cumplen años: ${nombres.join(", ")}.`;

    const { error: insErr } = await supabase.from("notificaciones").insert({
      tipo: "cumpleanos",
      titulo,
      cuerpo,
      dedupe_key,
      metadata: { personas_ids: personas.map((p) => p.id) },
    });

    if (insErr) {
      if (insErr.code === "23505") {
        return new Response(
          JSON.stringify({ ok: true, message: "Ya existía notificación del día (dedupe)", dedupe_key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw insErr;
    }

    return new Response(
      JSON.stringify({ ok: true, count: personas.length, dedupe_key }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("notify-birthdays:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
