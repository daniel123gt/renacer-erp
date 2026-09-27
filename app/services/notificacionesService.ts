import supabase from "~/utils/supabase";

export type TipoNotificacion = "cumpleanos" | "alquiler";

export interface NotificacionConEstado {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  created_at: string;
  leida: boolean;
}

/**
 * ID del usuario desde la sesión local (sin llamada al servidor de Auth).
 * Las políticas RLS validan igualmente el JWT en cada consulta.
 */
async function getSessionUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user?.id ?? null;
}

export const notificacionesService = {
  async listar(limite = 50): Promise<NotificacionConEstado[]> {
    const uid = await getSessionUserId();
    if (!uid) return [];

    const { data: notifs, error: nErr } = await supabase
      .from("notificaciones")
      .select("id, tipo, titulo, cuerpo, created_at")
      .order("created_at", { ascending: false })
      .limit(limite);

    if (nErr) throw nErr;
    if (!notifs?.length) return [];

    const { data: leidas, error: lErr } = await supabase
      .from("notificacion_lecturas")
      .select("notificacion_id")
      .eq("user_id", uid)
      .in(
        "notificacion_id",
        notifs.map((n) => n.id),
      );

    if (lErr) throw lErr;
    const leidasSet = new Set((leidas ?? []).map((r) => r.notificacion_id));

    return notifs.map((n) => ({
      id: n.id,
      tipo: n.tipo as TipoNotificacion,
      titulo: n.titulo,
      cuerpo: n.cuerpo,
      created_at: n.created_at,
      leida: leidasSet.has(n.id),
    }));
  },

  async contarNoLeidas(): Promise<number> {
    const list = await this.listar(200);
    return list.filter((n) => !n.leida).length;
  },

  async marcarLeida(notificacionId: string): Promise<void> {
    const uid = await getSessionUserId();
    if (!uid) return;

    const { error } = await supabase.from("notificacion_lecturas").insert({
      notificacion_id: notificacionId,
      user_id: uid,
    });
    if (error && error.code !== "23505") throw error;
  },

  async marcarTodasLeidas(): Promise<void> {
    const uid = await getSessionUserId();
    if (!uid) return;

    const list = await this.listar(200);
    const unread = list.filter((n) => !n.leida);
    if (unread.length === 0) return;

    const { error } = await supabase.from("notificacion_lecturas").upsert(
      unread.map((n) => ({ notificacion_id: n.id, user_id: uid })),
      { onConflict: "notificacion_id,user_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  },
};
