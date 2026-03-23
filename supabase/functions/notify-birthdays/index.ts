/**
 * Cron recomendado (UTC): 0 11 * * *  → ~06:00 America/Lima (sin DST en Perú)
 * Crea una notificación si hay personas activas que cumplen años ese día en Lima.
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

function birthdayEmailHtml(bodyText: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin: 0 0 8px 0;">Cumpleaños hoy</h2>
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

    let emailsSent = 0;
    let emailsError = 0;
    if (resendApiKey && resendFrom) {
      const recipients = await getRecipientEmails(supabase);
      for (const to of recipients) {
        try {
          const { data: dupRow, error: dupErr } = await supabase
            .from("email_logs")
            .select("id")
            .eq("tipo", "cumpleanos")
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
            html: birthdayEmailHtml(cuerpo),
          });

          const { error: logErr } = await supabase.from("email_logs").insert({
            tipo: "cumpleanos",
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
            tipo: "cumpleanos",
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
      JSON.stringify({
        ok: true,
        count: personas.length,
        dedupe_key,
        email: { sent: emailsSent, error: emailsError },
      }),
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
