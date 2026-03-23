import supabase from "~/utils/supabase";

export type EstadoActividad = "pendiente" | "activa" | "completada" | "cancelada";

/** Ítem de costo de insumos en una actividad */
export interface ActividadInsumo {
  nombre: string;
  costo: number;
}

export interface Actividad {
  id: string;
  nombre: string;
  tipo: string;
  proposito: string | null;
  meta_cantidad: number;
  precio_unitario: number;
  costo_total: number;
  /** Detalle de insumos (suma debe coincidir con costo_total al guardar) */
  insumos: ActividadInsumo[];
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: EstadoActividad;
  notas: string | null;
  created_at: string;
  vendidas?: number;
  recaudado?: number;
  total_pagado?: number;
}

export interface ActividadInput {
  nombre: string;
  tipo: string;
  proposito?: string | null;
  meta_cantidad: number;
  precio_unitario: number;
  costo_total?: number;
  insumos?: ActividadInsumo[];
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: EstadoActividad;
  notas?: string | null;
}

function parseInsumosFromRow(raw: unknown): ActividadInsumo[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((x: any) => ({
      nombre: String(x.nombre ?? "").trim(),
      costo: Math.max(0, Number(x.costo) || 0),
    }))
    .filter((x) => x.costo > 0 && x.nombre.length > 0);
}

/** Suma de costos de la lista de insumos */
export function sumarCostoInsumos(items: ActividadInsumo[]): number {
  return items.reduce((s, i) => s + (Number(i.costo) || 0), 0);
}

export interface ActividadVenta {
  id: string;
  actividad_id: string;
  persona: string;
  cantidad: number;
  monto: number;
  fecha: string;
  metodo_pago: string | null;
  entregado: boolean;
  cancelado: boolean;
  monto_pagado: number;
  notas: string | null;
  created_at: string;
}

export interface ActividadVentaInput {
  actividad_id: string;
  persona: string;
  cantidad: number;
  monto: number;
  fecha: string;
  metodo_pago?: string;
  entregado?: boolean;
  cancelado?: boolean;
  monto_pagado?: number;
  notas?: string | null;
}

function mapActividad(r: any): Actividad {
  const insumos = parseInsumosFromRow(r.insumos);
  return {
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo,
    proposito: r.proposito ?? null,
    meta_cantidad: Number(r.meta_cantidad),
    precio_unitario: Number(r.precio_unitario),
    costo_total: Number(r.costo_total ?? 0),
    insumos,
    fecha_inicio: r.fecha_inicio ?? null,
    fecha_fin: r.fecha_fin ?? null,
    estado: r.estado as EstadoActividad,
    notas: r.notas ?? null,
    created_at: r.created_at,
  };
}

function normalizeInsumosForDb(items: ActividadInsumo[] | undefined): ActividadInsumo[] {
  if (!items?.length) return [];
  return items
    .map((i) => ({
      nombre: i.nombre.trim(),
      costo: Math.max(0, Number(i.costo) || 0),
    }))
    .filter((i) => i.nombre.length > 0 && i.costo > 0);
}

function mapVenta(r: any): ActividadVenta {
  return {
    id: r.id,
    actividad_id: r.actividad_id,
    persona: r.persona,
    cantidad: Number(r.cantidad),
    monto: Number(r.monto),
    fecha: r.fecha,
    metodo_pago: r.metodo_pago ?? null,
    entregado: r.entregado ?? false,
    cancelado: r.cancelado ?? false,
    monto_pagado: Number(r.monto_pagado ?? 0),
    notas: r.notas ?? null,
    created_at: r.created_at,
  };
}

export const actividadesService = {
  async list(): Promise<Actividad[]> {
    const { data, error } = await supabase
      .from("actividades")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const actividades = (data ?? []).map(mapActividad);

    const ids = actividades.map((a) => a.id);
    if (ids.length > 0) {
      const { data: ventas } = await supabase
        .from("actividad_ventas")
        .select("actividad_id, cantidad, monto, monto_pagado")
        .in("actividad_id", ids);
      const ventasMap: Record<string, { vendidas: number; recaudado: number; total_pagado: number }> = {};
      (ventas ?? []).forEach((v: any) => {
        const key = v.actividad_id;
        if (!ventasMap[key]) ventasMap[key] = { vendidas: 0, recaudado: 0, total_pagado: 0 };
        ventasMap[key].vendidas += Number(v.cantidad);
        ventasMap[key].recaudado += Number(v.monto);
        ventasMap[key].total_pagado += Number(v.monto_pagado ?? 0);
      });
      actividades.forEach((a) => {
        a.vendidas = ventasMap[a.id]?.vendidas ?? 0;
        a.recaudado = ventasMap[a.id]?.recaudado ?? 0;
        a.total_pagado = ventasMap[a.id]?.total_pagado ?? 0;
      });
    }

    return actividades;
  },

  async getById(id: string): Promise<Actividad> {
    const { data, error } = await supabase
      .from("actividades")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    const actividad = mapActividad(data);

    const { data: ventas } = await supabase
      .from("actividad_ventas")
      .select("cantidad, monto, monto_pagado")
      .eq("actividad_id", id);
    actividad.vendidas = (ventas ?? []).reduce((s, v: any) => s + Number(v.cantidad), 0);
    actividad.recaudado = (ventas ?? []).reduce((s, v: any) => s + Number(v.monto), 0);
    actividad.total_pagado = (ventas ?? []).reduce((s, v: any) => s + Number(v.monto_pagado ?? 0), 0);

    return actividad;
  },

  async crear(input: ActividadInput): Promise<Actividad> {
    const { data: userData } = await supabase.auth.getUser();
    const insumosDb = normalizeInsumosForDb(input.insumos);
    const costo_total = sumarCostoInsumos(insumosDb);
    const { data, error } = await supabase
      .from("actividades")
      .insert({
        nombre: input.nombre.trim(),
        tipo: input.tipo.trim(),
        proposito: input.proposito?.trim() || null,
        meta_cantidad: input.meta_cantidad,
        precio_unitario: input.precio_unitario,
        costo_total,
        insumos: insumosDb,
        fecha_inicio: input.fecha_inicio || null,
        fecha_fin: input.fecha_fin || null,
        estado: input.estado || "pendiente",
        notas: input.notas?.trim() || null,
        created_by: userData?.user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapActividad(data);
  },

  async actualizar(id: string, input: Partial<ActividadInput>): Promise<Actividad> {
    const updateData: Record<string, any> = {};
    if (input.nombre !== undefined) updateData.nombre = input.nombre.trim();
    if (input.tipo !== undefined) updateData.tipo = input.tipo.trim();
    if (input.proposito !== undefined) updateData.proposito = input.proposito?.trim() || null;
    if (input.meta_cantidad !== undefined) updateData.meta_cantidad = input.meta_cantidad;
    if (input.precio_unitario !== undefined) updateData.precio_unitario = input.precio_unitario;
    if (input.insumos !== undefined) {
      const insumosDb = normalizeInsumosForDb(input.insumos);
      updateData.insumos = insumosDb;
      updateData.costo_total = sumarCostoInsumos(insumosDb);
    } else if (input.costo_total !== undefined) {
      updateData.costo_total = input.costo_total;
    }
    if (input.fecha_inicio !== undefined) updateData.fecha_inicio = input.fecha_inicio || null;
    if (input.fecha_fin !== undefined) updateData.fecha_fin = input.fecha_fin || null;
    if (input.estado !== undefined) updateData.estado = input.estado;
    if (input.notas !== undefined) updateData.notas = input.notas?.trim() || null;

    const { data, error } = await supabase
      .from("actividades")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapActividad(data);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from("actividades").delete().eq("id", id);
    if (error) throw error;
  },

  // --- Ventas de actividad ---
  async getVentas(actividadId: string): Promise<ActividadVenta[]> {
    const { data, error } = await supabase
      .from("actividad_ventas")
      .select("*")
      .eq("actividad_id", actividadId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapVenta);
  },

  async crearVenta(input: ActividadVentaInput): Promise<ActividadVenta> {
    const { data, error } = await supabase
      .from("actividad_ventas")
      .insert({
        actividad_id: input.actividad_id,
        persona: input.persona.trim(),
        cantidad: input.cantidad,
        monto: input.monto,
        fecha: input.fecha,
        metodo_pago: input.metodo_pago || "efectivo",
        entregado: input.entregado ?? false,
        cancelado: input.cancelado ?? false,
        monto_pagado: input.monto_pagado ?? 0,
        notas: input.notas?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapVenta(data);
  },

  async actualizarVenta(id: string, input: Partial<ActividadVentaInput>): Promise<ActividadVenta> {
    const updateData: Record<string, any> = {};
    if (input.persona !== undefined) updateData.persona = input.persona.trim();
    if (input.cantidad !== undefined) updateData.cantidad = input.cantidad;
    if (input.monto !== undefined) updateData.monto = input.monto;
    if (input.fecha !== undefined) updateData.fecha = input.fecha;
    if (input.metodo_pago !== undefined) updateData.metodo_pago = input.metodo_pago;
    if (input.entregado !== undefined) updateData.entregado = input.entregado;
    if (input.cancelado !== undefined) updateData.cancelado = input.cancelado;
    if (input.monto_pagado !== undefined) updateData.monto_pagado = input.monto_pagado;
    if (input.notas !== undefined) updateData.notas = input.notas?.trim() || null;

    const { data, error } = await supabase
      .from("actividad_ventas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapVenta(data);
  },

  async eliminarVenta(id: string): Promise<void> {
    const { error } = await supabase.from("actividad_ventas").delete().eq("id", id);
    if (error) throw error;
  },
};
