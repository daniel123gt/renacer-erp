import supabase from "~/utils/supabase";

export interface CategoriaFinanza {
  id: string;
  nombre: string;
  tipo: "entrada" | "salida";
  activa: boolean;
  orden: number;
}

export interface Transaccion {
  id: string;
  fecha: string;
  tipo: "entrada" | "salida";
  categoria_id: string | null;
  categoria_nombre?: string;
  descripcion: string;
  monto: number;
  persona: string | null;
  metodo_pago: string | null;
  notas: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TransaccionInput {
  fecha: string;
  tipo: "entrada" | "salida";
  categoria_id: string | null;
  descripcion: string;
  monto: number;
  persona?: string;
  metodo_pago?: string;
  notas?: string;
}

export interface BalanceMensual {
  mes: string;
  entradas: Transaccion[];
  salidas: Transaccion[];
  totalEntradas: number;
  totalSalidas: number;
  saldo: number;
  fondoAnterior: number;
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export const finanzasService = {
  async getCategorias(): Promise<CategoriaFinanza[]> {
    const { data, error } = await supabase
      .from("categorias_finanzas")
      .select("*")
      .eq("activa", true)
      .order("orden");
    if (error) throw error;
    return (data ?? []) as CategoriaFinanza[];
  },

  async getTransacciones(from: string, to: string): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from("transacciones")
      .select("*, categorias_finanzas(nombre)")
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      categoria_id: row.categoria_id,
      categoria_nombre: row.categorias_finanzas?.nombre ?? null,
      descripcion: row.descripcion,
      monto: Number(row.monto),
      persona: row.persona,
      metodo_pago: row.metodo_pago,
      notas: row.notas,
      created_at: row.created_at,
      created_by: row.created_by,
    }));
  },

  async getBalanceMensual(year: number, month: number): Promise<BalanceMensual> {
    const from = firstDayOfMonth(year, month);
    const to = lastDayOfMonth(year, month);
    const transacciones = await this.getTransacciones(from, to);

    const entradas = transacciones.filter((t) => t.tipo === "entrada");
    const salidas = transacciones.filter((t) => t.tipo === "salida");
    const totalEntradas = entradas.reduce((sum, t) => sum + t.monto, 0);
    const totalSalidas = salidas.reduce((sum, t) => sum + t.monto, 0);

    const fondoAnterior = await this.getFondoAnterior(year, month);

    return {
      mes: `${year}-${String(month).padStart(2, "0")}`,
      entradas,
      salidas,
      totalEntradas: totalEntradas + fondoAnterior,
      totalSalidas,
      saldo: totalEntradas + fondoAnterior - totalSalidas,
      fondoAnterior,
    };
  },

  async getFondoAnterior(year: number, month: number): Promise<number> {
    const hasta = firstDayOfMonth(year, month);
    const { data, error } = await supabase
      .from("transacciones")
      .select("tipo, monto")
      .lt("fecha", hasta);
    if (error) return 0;
    let saldo = 0;
    (data ?? []).forEach((row: any) => {
      const m = Number(row.monto);
      saldo += row.tipo === "entrada" ? m : -m;
    });
    return saldo;
  },

  async crear(input: TransaccionInput): Promise<Transaccion> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transacciones")
      .insert({
        fecha: input.fecha,
        tipo: input.tipo,
        categoria_id: input.categoria_id || null,
        descripcion: input.descripcion.trim(),
        monto: input.monto,
        persona: input.persona?.trim() || null,
        metodo_pago: input.metodo_pago || null,
        notas: input.notas?.trim() || null,
        created_by: userData?.user?.id ?? null,
      })
      .select("*, categorias_finanzas(nombre)")
      .single();
    if (error) throw error;
    return {
      ...data,
      monto: Number(data.monto),
      categoria_nombre: (data as any).categorias_finanzas?.nombre ?? null,
    } as Transaccion;
  },

  async actualizar(id: string, input: Partial<TransaccionInput>): Promise<Transaccion> {
    const updateData: Record<string, any> = {};
    if (input.fecha !== undefined) updateData.fecha = input.fecha;
    if (input.tipo !== undefined) updateData.tipo = input.tipo;
    if (input.categoria_id !== undefined) updateData.categoria_id = input.categoria_id || null;
    if (input.descripcion !== undefined) updateData.descripcion = input.descripcion.trim();
    if (input.monto !== undefined) updateData.monto = input.monto;
    if (input.persona !== undefined) updateData.persona = input.persona?.trim() || null;
    if (input.metodo_pago !== undefined) updateData.metodo_pago = input.metodo_pago || null;
    if (input.notas !== undefined) updateData.notas = input.notas?.trim() || null;

    const { data, error } = await supabase
      .from("transacciones")
      .update(updateData)
      .eq("id", id)
      .select("*, categorias_finanzas(nombre)")
      .single();
    if (error) throw error;
    return {
      ...data,
      monto: Number(data.monto),
      categoria_nombre: (data as any).categorias_finanzas?.nombre ?? null,
    } as Transaccion;
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from("transacciones").delete().eq("id", id);
    if (error) throw error;
  },

  async getTransaccionesPorCategoria(
    categoriaNombre: string,
    from: string,
    to: string
  ): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from("transacciones")
      .select("*, categorias_finanzas!inner(nombre)")
      .eq("categorias_finanzas.nombre", categoriaNombre)
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      categoria_id: row.categoria_id,
      categoria_nombre: row.categorias_finanzas?.nombre ?? null,
      descripcion: row.descripcion,
      monto: Number(row.monto),
      persona: row.persona,
      metodo_pago: row.metodo_pago,
      notas: row.notas,
      created_at: row.created_at,
      created_by: row.created_by,
    }));
  },

  async getTransaccionesPorTipo(
    tipo: "entrada" | "salida",
    from: string,
    to: string
  ): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from("transacciones")
      .select("*, categorias_finanzas(nombre)")
      .eq("tipo", tipo)
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      categoria_id: row.categoria_id,
      categoria_nombre: row.categorias_finanzas?.nombre ?? null,
      descripcion: row.descripcion,
      monto: Number(row.monto),
      persona: row.persona,
      metodo_pago: row.metodo_pago,
      notas: row.notas,
      created_at: row.created_at,
      created_by: row.created_by,
    }));
  },

  async getResumenAnual(year: number) {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const { data, error } = await supabase
      .from("transacciones")
      .select("fecha, tipo, monto")
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha");
    if (error) throw error;

    const meses: Record<string, { entradas: number; salidas: number }> = {};
    (data ?? []).forEach((row: any) => {
      const mes = String(row.fecha).slice(0, 7);
      if (!meses[mes]) meses[mes] = { entradas: 0, salidas: 0 };
      if (row.tipo === "entrada") meses[mes].entradas += Number(row.monto);
      else meses[mes].salidas += Number(row.monto);
    });

    return Object.entries(meses)
      .map(([mes, vals]) => ({
        mes,
        entradas: vals.entradas,
        salidas: vals.salidas,
        saldo: vals.entradas - vals.salidas,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  },

  /**
   * Sincroniza ventas de Renashop de un día como una sola entrada en Finanzas.
   * Por defecto evita duplicados usando un marcador en notas: renashop_sync:YYYY-MM-DD
   */
  async sincronizarVentasRenashopDia(
    fecha: string,
    options?: { sobrescribirDuplicado?: boolean }
  ): Promise<{ monto: number; transaccion: Transaccion }> {
    const marker = `renashop_sync:${fecha}`;
    const sobrescribirDuplicado = options?.sobrescribirDuplicado === true;

    if (!sobrescribirDuplicado) {
      const { data: dupRows, error: dupErr } = await supabase
        .from("transacciones")
        .select("id")
        .eq("tipo", "entrada")
        .eq("fecha", fecha)
        .ilike("notas", `%${marker}%`)
        .limit(1);
      if (dupErr) throw dupErr;
      if ((dupRows ?? []).length > 0) {
        throw new Error("Ya existe una sincronización de Renashop para esa fecha.");
      }
    }

    const { data: cabs, error: cabsErr } = await supabase
      .from("ventas_renashop_cabeceras")
      .select("id")
      .eq("fecha", fecha);
    if (cabsErr) throw cabsErr;
    const ids = (cabs ?? []).map((r: any) => r.id);
    if (ids.length === 0) {
      throw new Error("No hay ventas de Renashop en la fecha seleccionada.");
    }

    const { data: lines, error: linesErr } = await supabase
      .from("ventas_renashop_lineas")
      .select("total")
      .in("venta_id", ids);
    if (linesErr) throw linesErr;
    const monto = (lines ?? []).reduce((s: number, r: any) => s + Number(r.total), 0);
    if (monto <= 0) {
      throw new Error("Las ventas de Renashop de esa fecha suman 0.");
    }

    const { data: cat, error: catErr } = await supabase
      .from("categorias_finanzas")
      .select("id")
      .eq("tipo", "entrada")
      .eq("nombre", "Venta Renashop")
      .limit(1)
      .maybeSingle();
    if (catErr) throw catErr;

    const input: TransaccionInput = {
      fecha,
      tipo: "entrada",
      categoria_id: cat?.id ?? null,
      descripcion: `Sincronización Renashop ${fecha}`,
      monto,
      metodo_pago: "otro",
      notas: `${marker} | tickets:${ids.length}`,
    };
    const transaccion = await this.crear(input);
    return { monto, transaccion };
  },
};
