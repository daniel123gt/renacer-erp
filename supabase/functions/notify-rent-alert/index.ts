/**
 * Cron recomendado (UTC): 0 * * * *  (cada hora en punto)
 *
 * Regla horaria (Lima):
 * - Si es lunes/martes/miércoles: no se envía.
 * - Si es jueves: solo en la noche (20:00).
 * - Si es viernes/sábado/domingo: solo 2 veces al día (06:00 y 20:00).
 *
 * Cuando saldo del mes < app_config.cuota_alquiler -> crea notificación y email (con dedupe por franja).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResendOk = { id?: string };

async function getRecipientEmails(supabase: any): Promise<string[]> {
  const emails: string[] = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      const email = String(u.email ?? "").trim().toLowerCase();
      const confirmed = !!u.email_confirmed_at;
      if (email && confirmed) emails.push(email);
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return Array.from(new Set(emails)).sort();
}

async function sendEmailViaResend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<ResendOk> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });
  const json = (await resp.json().catch(() => ({}))) as any;
  if (!resp.ok) {
    const msg = String(json?.message ?? json?.error ?? `HTTP ${resp.status}`);
    throw new Error(`Resend error: ${msg}`);
  }
  return { id: json?.id ? String(json.id) : undefined };
}

function rentEmailHtml(bodyText: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin: 0 0 8px 0;">Alerta de cuota de alquiler</h2>
      <p style="margin: 0 0 12px 0;">${bodyText}</p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        Mensaje automático de Renacer ERP.
      </p>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const resendFrom = Deno.env.get("RESEND_FROM") ?? "";

    const { data: cal, error: calErr } = await supabase.rpc("lima_calendar");
    if (calErr) throw calErr;
    const row = Array.isArray(cal) ? cal[0] : cal;
    if (!row) throw new Error("lima_calendar sin fila");

    const y = row.y as number;
    const m = row.m as number;
    const d = row.d as number;
    const isodow = row.isodow as number;
    const hr = row.hr as number;

    const isThu = isodow === 4;
    const isFriSatSun = isodow >= 5;
    const slot = hr === 6 ? "manana" : hr === 20 ? "noche" : null;
    const shouldRunWindow = (isThu && hr >= 20) || isFriSatSun;
    if (!shouldRunWindow || !slot) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "Fuera de franja de envío (06:00 o 20:00; desde jueves noche)",
          lima: { isodow, hr },
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
    const dedupe_key = `alquiler-${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}-${slot}`;
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

    let emailsSent = 0;
    let emailsError = 0;
    if (resendApiKey && resendFrom) {
      const recipients = await getRecipientEmails(supabase);
      for (const to of recipients) {
        try {
          const { data: dupRow, error: dupErr } = await supabase
            .from("email_logs")
            .select("id")
            .eq("tipo", "alquiler")
            .eq("dedupe_key", dedupe_key)
            .eq("to_email", to)
            .limit(1)
            .maybeSingle();
          if (dupErr) throw dupErr;
          if (dupRow?.id) continue;

          const result = await sendEmailViaResend({
            apiKey: resendApiKey,
            from: resendFrom,
            to,
            subject: titulo,
            html: rentEmailHtml(cuerpo),
          });

          const { error: logErr } = await supabase.from("email_logs").insert({
            tipo: "alquiler",
            dedupe_key,
            to_email: to,
            subject: titulo,
            status: "sent",
            provider: "resend",
            provider_message_id: result.id ?? null,
          });
          if (logErr && logErr.code !== "23505") throw logErr;
          emailsSent += 1;
        } catch (mailErr) {
          const message = mailErr instanceof Error ? mailErr.message : String(mailErr);
          await supabase.from("email_logs").insert({
            tipo: "alquiler",
            dedupe_key,
            to_email: to,
            subject: titulo,
            status: "error",
            provider: "resend",
            error: message,
          });
          emailsError += 1;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, dedupe_key, saldo, cuota, faltante, email: { sent: emailsSent, error: emailsError } }),
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
