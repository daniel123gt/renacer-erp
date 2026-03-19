/**
 * Cron recomendado (UTC): 0 * * * *  (cada hora en punto)
 * Solo actúa si en America/Lima es jueves (ISODOW 4) y hora local >= 16,
 * y el saldo del mes es menor que app_config.cuota_alquiler.
 * dedupe_key por hora lima evita duplicados en la misma hora.
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
    const isodow = row.isodow as number;
    const hr = row.hr as number;
    const mi = typeof row.mi === "number" ? row.mi : 0;

    if (isodow !== 4 || hr < 16) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "Solo jueves desde las 16:00 (Lima)",
          lima: { isodow, hr, mi },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: cfg, error: cfgErr } = await supabase
      .from("app_config")
      .select("valor")
      .eq("clave", "cuota_alquiler")
      .maybeSingle();

    if (cfgErr) throw cfgErr;
    const cuota = parseFloat(cfg?.valor ?? "275");
    if (!Number.isFinite(cuota) || cuota <= 0) {
      throw new Error("cuota_alquiler inválida en app_config");
    }

    const { data: saldoRaw, error: saldoErr } = await supabase.rpc("fn_saldo_mes_actual_lima");
    if (saldoErr) throw saldoErr;
    const saldo = typeof saldoRaw === "number" ? saldoRaw : parseFloat(String(saldoRaw));

    if (saldo >= cuota) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "Saldo suficiente",
          saldo,
          cuota,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const faltante = cuota - saldo;
    const dedupe_key = `alquiler-${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}-${String(hr).padStart(2, "0")}`;
    const titulo = "Alerta: cuota de alquiler";
    const cuerpo =
      `El saldo actual del mes (S/ ${saldo.toFixed(2)}) es menor que la cuota de alquiler (S/ ${cuota.toFixed(2)}). ` +
      `Faltan S/ ${faltante.toFixed(2)}.`;

    const { error: insErr } = await supabase.from("notificaciones").insert({
      tipo: "alquiler",
      titulo,
      cuerpo,
      dedupe_key,
      metadata: { saldo, cuota, faltante },
    });

    if (insErr) {
      if (insErr.code === "23505") {
        return new Response(
          JSON.stringify({ ok: true, message: "Ya notificado esta hora", dedupe_key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw insErr;
    }

    return new Response(
      JSON.stringify({ ok: true, dedupe_key, saldo, cuota, faltante }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("notify-rent-alert:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
