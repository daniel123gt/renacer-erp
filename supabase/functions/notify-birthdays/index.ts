/**
 * Cron recomendado (UTC): 0 11 * * *  → ~06:00 America/Lima (sin DST en Perú)
 * Crea notificaciones de cumpleaños:
 * - el mismo día (hoy)
 * - un recordatorio el día anterior (mañana)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { broadcastWebPush, truncatePushBody } from "../_shared/webPushBroadcast.ts";

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

const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Fecha calendario Lima (año/mes/día ya en zona local del negocio). */
function formatFechaLargaEs(y: number, m: number, d: number): string {
  const mes = MESES_ES[m - 1] ?? "mes";
  return `${d} de ${mes} de ${y}`;
}

type SendEmailParams = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
} & (
  | { html: string; template?: never; templateVariables?: never }
  | { html?: never; template: string; templateVariables: Record<string, string> }
);

async function sendEmailViaResend(params: SendEmailParams): Promise<ResendOk> {
  const payload: Record<string, unknown> = {
    from: params.from,
    to: [params.to],
    subject: params.subject,
  };
  if ("template" in params && params.template) {
    payload.template = {
      id: params.template,
      variables: params.templateVariables,
    };
  } else if ("html" in params && params.html) {
    payload.html = params.html;
  } else {
    throw new Error("Resend: hace falta html o template + variables");
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

function buildBirthdayCopy(nombres: string[], isTomorrow: boolean): { titulo: string; cuerpo: string } {
  if (isTomorrow) {
    return {
      titulo: nombres.length === 1 ? "Cumpleaños mañana" : `Cumpleaños mañana (${nombres.length})`,
      cuerpo:
        nombres.length === 1
          ? `Mañana es el cumpleaños del hermano: ${nombres[0]}.`
          : `Mañana es el cumpleaños de los hermanos: ${nombres.join(", ")}.`,
    };
  }

  return {
    titulo: nombres.length === 1 ? "Cumpleaños hoy" : `Cumpleaños hoy (${nombres.length})`,
    cuerpo:
      nombres.length === 1
        ? `Hoy cumple años: ${nombres[0]}.`
        : `Hoy cumplen años: ${nombres.join(", ")}.`,
  };
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
    /** ID o alias de la plantilla publicada en Resend (opcional). Debe usar variables TITULO, MENSAJE, FECHA_LIMA, APP_NAME. */
    const resendBirthdayTemplateId = (Deno.env.get("RESEND_BIRTHDAY_TEMPLATE_ID") ?? "").trim();
    const appNameForEmail = (Deno.env.get("APP_NAME_EMAIL") ?? "Renacer ERP").trim();

    const { data: cal, error: calErr } = await supabase.rpc("lima_calendar");
    if (calErr) throw calErr;
    const row = Array.isArray(cal) ? cal[0] : cal;
    if (!row) throw new Error("lima_calendar sin fila");

    const y = row.y as number;
    const m = row.m as number;
    const d = row.d as number;

    const todayLima = new Date(Date.UTC(y, m - 1, d));
    const tomorrowLima = new Date(todayLima);
    tomorrowLima.setUTCDate(tomorrowLima.getUTCDate() + 1);
    const tm = tomorrowLima.getUTCMonth() + 1;
    const td = tomorrowLima.getUTCDate();
    const ty = tomorrowLima.getUTCFullYear();

    const { data: personasHoy, error: pErrHoy } = await supabase
      .from("personas")
      .select("id, nombre")
      .eq("activo", true)
      .eq("cumple_mes", m)
      .eq("cumple_dia", d);
    if (pErrHoy) throw pErrHoy;

    const { data: personasManana, error: pErrManana } = await supabase
      .from("personas")
      .select("id, nombre")
      .eq("activo", true)
      .eq("cumple_mes", tm)
      .eq("cumple_dia", td);
    if (pErrManana) throw pErrManana;

    const hasToday = !!personasHoy?.length;
    const hasTomorrow = !!personasManana?.length;

    if (!hasToday && !hasTomorrow) {
      return new Response(
        JSON.stringify({ ok: true, message: "Sin cumpleaños hoy ni mañana", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const buckets = [
      {
        isTomorrow: false,
        y,
        m,
        d,
        personas: personasHoy ?? [],
      },
      {
        isTomorrow: true,
        y: ty,
        m: tm,
        d: td,
        personas: personasManana ?? [],
      },
    ].filter((b) => b.personas.length > 0);

    const dedupeKeys: string[] = [];
    const insertedNotifications: string[] = [];
    let emailsSent = 0;
    let emailsError = 0;
    let webPushSent = 0;
    let webPushFailed = 0;
    let webPushSkippedReason: string | null = null;
    const recipients = resendApiKey && resendFrom ? await getRecipientEmails(supabase) : [];

    for (const bucket of buckets) {
      const nombres = bucket.personas.map((p) => p.nombre).sort((a, b) => a.localeCompare(b, "es"));
      const dedupe_key = `cumpleanos-${bucket.isTomorrow ? "manana" : "hoy"}-${bucket.y}-${String(bucket.m).padStart(2, "0")}-${String(bucket.d).padStart(2, "0")}`;
      dedupeKeys.push(dedupe_key);
      const { titulo, cuerpo } = buildBirthdayCopy(nombres, bucket.isTomorrow);
      const fechaLima = formatFechaLargaEs(bucket.y, bucket.m, bucket.d);

      const { error: insErr } = await supabase.from("notificaciones").insert({
        tipo: "cumpleanos",
        titulo,
        cuerpo,
        dedupe_key,
        metadata: {
          personas_ids: bucket.personas.map((p) => p.id),
          reminder: bucket.isTomorrow ? "day_before" : "same_day",
          target_date_lima: `${bucket.y}-${String(bucket.m).padStart(2, "0")}-${String(bucket.d).padStart(2, "0")}`,
        },
      });

      if (insErr) {
        if (insErr.code === "23505") continue;
        throw insErr;
      }
      insertedNotifications.push(dedupe_key);

      const wp = await broadcastWebPush(supabase, {
        title: titulo,
        body: truncatePushBody(cuerpo),
        tag: dedupe_key,
        url: "/",
      });
      if (wp.skipped) webPushSkippedReason = wp.reason;
      else {
        webPushSent += wp.sent;
        webPushFailed += wp.failed;
      }

      if (resendApiKey && resendFrom) {
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

            const result = resendBirthdayTemplateId
              ? await sendEmailViaResend({
                  apiKey: resendApiKey,
                  from: resendFrom,
                  to,
                  subject: titulo,
                  template: resendBirthdayTemplateId,
                  templateVariables: {
                    TITULO: titulo,
                    MENSAJE: cuerpo,
                    FECHA_LIMA: fechaLima,
                    APP_NAME: appNameForEmail,
                  },
                })
              : await sendEmailViaResend({
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
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: (personasHoy?.length ?? 0) + (personasManana?.length ?? 0),
        today_count: personasHoy?.length ?? 0,
        tomorrow_count: personasManana?.length ?? 0,
        dedupe_keys: dedupeKeys,
        inserted_notifications: insertedNotifications,
        email: { sent: emailsSent, error: emailsError },
        web_push:
          insertedNotifications.length === 0
            ? null
            : webPushSkippedReason !== null && webPushSent === 0 && webPushFailed === 0
              ? { skipped: true, reason: webPushSkippedReason }
              : { skipped: false, sent: webPushSent, failed: webPushFailed },
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
