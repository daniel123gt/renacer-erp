import supabase from "~/utils/supabase";

export const appConfigService = {
  async getValor(clave: string): Promise<string | null> {
    const { data, error } = await supabase.from("app_config").select("valor").eq("clave", clave).maybeSingle();
    if (error) throw error;
    return data?.valor ?? null;
  },

  async setValor(clave: string, valor: string): Promise<void> {
    const { error } = await supabase.from("app_config").upsert(
      { clave, valor, updated_at: new Date().toISOString() },
      { onConflict: "clave" },
    );
    if (error) throw error;
  },

  /** Cuota de alquiler en soles (S/) para alertas de jueves. */
  async getCuotaAlquiler(): Promise<number> {
    const v = await this.getValor("cuota_alquiler");
    const n = parseFloat(v ?? "275");
    return Number.isFinite(n) && n > 0 ? n : 275;
  },

  async setCuotaAlquiler(monto: number): Promise<void> {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("Monto inválido");
    await this.setValor("cuota_alquiler", String(monto));
  },
};
