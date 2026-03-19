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

export const notificacionesService = {
  async listar(limite = 50): Promise<NotificacionConEstado[]> {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const uid = userData.user?.id;
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
      .eq("user_id", uid);

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
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const uid = userData.user?.id;
    if (!uid) return;

    const { error } = await supabase.from("notificacion_lecturas").insert({
      notificacion_id: notificacionId,
      user_id: uid,
    });
    if (error && error.code !== "23505") throw error;
  },

  async marcarTodasLeidas(): Promise<void> {
    const list = await this.listar(200);
    const unread = list.filter((n) => !n.leida);
    await Promise.all(unread.map((n) => this.marcarLeida(n.id)));
  },
};
