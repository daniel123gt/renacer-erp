import supabase from "~/utils/supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
};

export async function ensurePushSubscribed(params: {
  vapidPublicKey: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "no_client" };
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "no_sw" };
  if (!("PushManager" in window)) return { ok: false, reason: "no_push_manager" };
  if (typeof Notification === "undefined") return { ok: false, reason: "no_notification_api" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "permission_denied" };

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(params.vapidPublicKey),
    }));

  const json = sub.toJSON() as any;
  const endpoint = String(json?.endpoint ?? "");
  const p256dh = String(json?.keys?.p256dh ?? "");
  const auth = String(json?.keys?.auth ?? "");
  if (!endpoint || !p256dh || !auth) return { ok: false, reason: "bad_subscription" };

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { ok: false, reason: "no_user" };
  if (!userData.user?.id) return { ok: false, reason: "no_user" };

  const row: PushSubscriptionRow = {
    endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
  };

  const { error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
  if (error) return { ok: false, reason: "db_error" };
  return { ok: true };
}

