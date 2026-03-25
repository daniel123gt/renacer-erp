/**
 * Envío masivo Web Push a `push_subscriptions` (mismos secrets que send-web-push-test).
 * Si faltan VAPID_* en secrets, no lanza error: devuelve skipped.
 */
import webpush from "https://esm.sh/web-push@3.6.7";

type PushRow = { endpoint: string; p256dh: string; auth: string };

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
};

export type WebPushBroadcastResult =
  | { skipped: true; reason: string }
  | { skipped: false; total: number; sent: number; failed: number };

let vapidReady = false;

function configureVapidOnce(): boolean {
  if (vapidReady) return true;
  const pub = (Deno.env.get("VAPID_PUBLIC_KEY") ?? "").trim();
  const priv = (Deno.env.get("VAPID_PRIVATE_KEY") ?? "").trim();
  const subj = (Deno.env.get("VAPID_SUBJECT") ?? "").trim();
  if (!pub || !priv || !subj) return false;
  webpush.setVapidDetails(subj, pub, priv);
  vapidReady = true;
  return true;
}

/** Trunca cuerpo para notificaciones del sistema (evita payloads enormes). */
export function truncatePushBody(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function broadcastWebPush(supabase: any, payload: WebPushPayload): Promise<WebPushBroadcastResult> {
  if (!configureVapidOnce()) {
    return { skipped: true, reason: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT no configurados" };
  }

  const { data, error } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) {
    console.error("broadcastWebPush: select", error.message);
    return { skipped: true, reason: error.message };
  }

  const subs = (data ?? []) as PushRow[];
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/icon-192.png",
    tag: payload.tag ?? "renacer-push",
  });

  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any,
        body,
      );
      sent += 1;
    } catch (e) {
      failed += 1;
      console.warn("broadcastWebPush: fallo endpoint", String(s.endpoint).slice(0, 48), e);
    }
  }

  return { skipped: false, total: subs.length, sent, failed };
}
