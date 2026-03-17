import supabase from "~/utils/supabase";

export interface VentaRenashop {
  id: string;
  fecha: string;
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  metodo_pago: string | null;
  notas: string | null;
  created_at: string;
  created_by: string | null;
}

export interface VentaInput {
  fecha: string;
  producto_id?: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  metodo_pago?: string;
  notas?: string;
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export const ventasRenashopService = {
  async getVentas(from: string, to: string): Promise<VentaRenashop[]> {
    const { data, error } = await supabase
      .from("ventas_renashop")
      .select("*")
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      ...r,
      cantidad: Number(r.cantidad),
      precio_unitario: Number(r.precio_unitario),
      total: Number(r.total),
    }));
  },

  async getVentasMes(year: number, month: number): Promise<VentaRenashop[]> {
    return this.getVentas(firstDayOfMonth(year, month), lastDayOfMonth(year, month));
  },

  async crear(input: VentaInput): Promise<VentaRenashop> {
    const { data: userData } = await supabase.auth.getUser();
    const total = input.cantidad * input.precio_unitario;
    const { data, error } = await supabase
      .from("ventas_renashop")
      .insert({
        fecha: input.fecha,
        producto_id: input.producto_id || null,
        producto_nombre: input.producto_nombre.trim(),
        cantidad: input.cantidad,
        precio_unitario: input.precio_unitario,
        total,
        metodo_pago: input.metodo_pago || "efectivo",
        notas: input.notas?.trim() || null,
        created_by: userData?.user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      cantidad: Number(data.cantidad),
      precio_unitario: Number(data.precio_unitario),
      total: Number(data.total),
    } as VentaRenashop;
  },

  async actualizar(id: string, input: Partial<VentaInput>): Promise<VentaRenashop> {
    const updateData: Record<string, any> = {};
    if (input.fecha !== undefined) updateData.fecha = input.fecha;
    if (input.producto_id !== undefined) updateData.producto_id = input.producto_id || null;
    if (input.producto_nombre !== undefined) updateData.producto_nombre = input.producto_nombre.trim();
    if (input.cantidad !== undefined) updateData.cantidad = input.cantidad;
    if (input.precio_unitario !== undefined) updateData.precio_unitario = input.precio_unitario;
    if (input.cantidad !== undefined && input.precio_unitario !== undefined) {
      updateData.total = input.cantidad * input.precio_unitario;
    }
    if (input.metodo_pago !== undefined) updateData.metodo_pago = input.metodo_pago;
    if (input.notas !== undefined) updateData.notas = input.notas?.trim() || null;

    const { data, error } = await supabase
      .from("ventas_renashop")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      cantidad: Number(data.cantidad),
      precio_unitario: Number(data.precio_unitario),
      total: Number(data.total),
    } as VentaRenashop;
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from("ventas_renashop").delete().eq("id", id);
    if (error) throw error;
  },

  async getResumenHoy(): Promise<{ totalVentas: number; cantidadVentas: number }> {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("ventas_renashop")
      .select("total")
      .eq("fecha", hoy);
    if (error) return { totalVentas: 0, cantidadVentas: 0 };
    const rows = data ?? [];
    return {
      totalVentas: rows.reduce((s, r: any) => s + Number(r.total), 0),
      cantidadVentas: rows.length,
    };
  },

  async getResumenMes(year: number, month: number) {
    const ventas = await this.getVentasMes(year, month);
    const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
    const cantidadVentas = ventas.length;
    const productosVendidos = ventas.reduce((s, v) => s + v.cantidad, 0);
    return { totalVentas, cantidadVentas, productosVendidos };
  },
};
