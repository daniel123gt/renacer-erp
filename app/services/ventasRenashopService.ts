import supabase from "~/utils/supabase";

/** Cobrado vs venta fiada / por cobrar */
export type EstadoPagoVenta = "pagado" | "pendiente";

/** Línea de detalle (producto) dentro de un ticket */
export interface VentaRenashopLinea {
  id: string;
  venta_id: string;
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  total: number;
  ganancia: number;
}

/** Ticket de venta (cabecera + líneas) */
export interface VentaRenashop {
  id: string;
  fecha: string;
  metodo_pago: string | null;
  estado_pago: EstadoPagoVenta;
  notas: string | null;
  created_at: string;
  created_by: string | null;
  lineas: VentaRenashopLinea[];
}

export interface VentaCabeceraInput {
  fecha: string;
  metodo_pago?: string;
  estado_pago?: EstadoPagoVenta;
  notas?: string;
}

export interface VentaLineaInput {
  producto_id: string | null;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
}

const CAB = "ventas_renashop_cabeceras";
const LIN = "ventas_renashop_lineas";

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function mapEstado(raw: string | null | undefined): EstadoPagoVenta {
  return raw === "pendiente" ? "pendiente" : "pagado";
}

function mapLinea(r: any): VentaRenashopLinea {
  return {
    id: String(r.id),
    venta_id: String(r.venta_id),
    producto_id: r.producto_id ?? null,
    producto_nombre: String(r.producto_nombre ?? ""),
    cantidad: Number(r.cantidad),
    costo_unitario: Number(r.costo_unitario ?? 0),
    precio_unitario: Number(r.precio_unitario),
    total: Number(r.total),
    ganancia: Number(r.ganancia ?? 0),
  };
}

function mapVenta(row: any): VentaRenashop {
  const rawLineas = row.ventas_renashop_lineas ?? row.lineas ?? [];
  const lineas = (Array.isArray(rawLineas) ? rawLineas : []).map(mapLinea);
  lineas.sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre, "es"));
  return {
    id: String(row.id),
    fecha: String(row.fecha).slice(0, 10),
    metodo_pago: row.metodo_pago ?? null,
    estado_pago: mapEstado(row.estado_pago),
    notas: row.notas ?? null,
    created_at: String(row.created_at),
    created_by: row.created_by ?? null,
    lineas,
  };
}

/** Suma de totales de líneas (monto del ticket) */
export function totalVenta(v: VentaRenashop): number {
  return v.lineas.reduce((s, l) => s + l.total, 0);
}

export function totalGananciaVenta(v: VentaRenashop): number {
  return v.lineas.reduce((s, l) => s + l.ganancia, 0);
}

export function unidadesVenta(v: VentaRenashop): number {
  return v.lineas.reduce((s, l) => s + l.cantidad, 0);
}

/** Texto corto para listados */
export function resumenProductosVenta(v: VentaRenashop): string {
  if (v.lineas.length === 0) return "—";
  if (v.lineas.length === 1) return v.lineas[0].producto_nombre;
  const first = v.lineas[0].producto_nombre;
  const short = first.length > 22 ? `${first.slice(0, 20)}…` : first;
  return `${short} +${v.lineas.length - 1}`;
}

export const ventasRenashopService = {
  async getVentas(from: string, to: string): Promise<VentaRenashop[]> {
    const { data, error } = await supabase
      .from(CAB)
      .select(
        `
        id,
        fecha,
        metodo_pago,
        estado_pago,
        notas,
        created_at,
        created_by,
        ventas_renashop_lineas (
          id,
          venta_id,
          producto_id,
          producto_nombre,
          cantidad,
          costo_unitario,
          precio_unitario,
          total,
          ganancia
        )
      `
      )
      .gte("fecha", from)
      .lte("fecha", to)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapVenta);
  },

  async getVentasMes(year: number, month: number): Promise<VentaRenashop[]> {
    return this.getVentas(firstDayOfMonth(year, month), lastDayOfMonth(year, month));
  },

  async getById(id: string): Promise<VentaRenashop | null> {
    const { data, error } = await supabase
      .from(CAB)
      .select(
        `
        id,
        fecha,
        metodo_pago,
        estado_pago,
        notas,
        created_at,
        created_by,
        ventas_renashop_lineas (
          id,
          venta_id,
          producto_id,
          producto_nombre,
          cantidad,
          costo_unitario,
          precio_unitario,
          total,
          ganancia
        )
      `
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapVenta(data);
  },

  /** Nuevo ticket: cabecera + líneas en una sola operación lógica */
  async crearVenta(lineas: VentaLineaInput[], cabecera: VentaCabeceraInput): Promise<VentaRenashop> {
    if (lineas.length === 0) throw new Error("La venta debe tener al menos una línea");
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id ?? null;
    const estado = cabecera.estado_pago === "pendiente" ? "pendiente" : "pagado";

    const { data: cabRow, error: cabErr } = await supabase
      .from(CAB)
      .insert({
        fecha: cabecera.fecha,
        metodo_pago: cabecera.metodo_pago || "plin",
        estado_pago: estado,
        notas: cabecera.notas?.trim() || null,
        created_by: uid,
      })
      .select("id")
      .single();
    if (cabErr) throw cabErr;
    const ventaId = cabRow.id as string;

    const lineRows = lineas.map((line) => {
      const total = line.cantidad * line.precio_unitario;
      const ganancia = (line.precio_unitario - line.costo_unitario) * line.cantidad;
      return {
        venta_id: ventaId,
        producto_id: line.producto_id || null,
        producto_nombre: line.producto_nombre.trim(),
        cantidad: line.cantidad,
        costo_unitario: line.costo_unitario,
        precio_unitario: line.precio_unitario,
        total,
        ganancia,
      };
    });
    const { error: linErr } = await supabase.from(LIN).insert(lineRows);
    if (linErr) {
      await supabase.from(CAB).delete().eq("id", ventaId);
      throw linErr;
    }

    const full = await this.getById(ventaId);
    if (!full) throw new Error("No se pudo cargar la venta creada");
    return full;
  },

  /** Sustituye líneas y actualiza cabecera */
  async actualizarVenta(
    ventaId: string,
    cabecera: VentaCabeceraInput,
    lineas: VentaLineaInput[]
  ): Promise<VentaRenashop> {
    if (lineas.length === 0) throw new Error("La venta debe tener al menos una línea");
    const estado = cabecera.estado_pago === "pendiente" ? "pendiente" : "pagado";

    const { error: uErr } = await supabase
      .from(CAB)
      .update({
        fecha: cabecera.fecha,
        metodo_pago: cabecera.metodo_pago || "plin",
        estado_pago: estado,
        notas: cabecera.notas?.trim() || null,
      })
      .eq("id", ventaId);
    if (uErr) throw uErr;

    const { error: dErr } = await supabase.from(LIN).delete().eq("venta_id", ventaId);
    if (dErr) throw dErr;

    const lineRows = lineas.map((line) => {
      const total = line.cantidad * line.precio_unitario;
      const ganancia = (line.precio_unitario - line.costo_unitario) * line.cantidad;
      return {
        venta_id: ventaId,
        producto_id: line.producto_id || null,
        producto_nombre: line.producto_nombre.trim(),
        cantidad: line.cantidad,
        costo_unitario: line.costo_unitario,
        precio_unitario: line.precio_unitario,
        total,
        ganancia,
      };
    });
    const { error: iErr } = await supabase.from(LIN).insert(lineRows);
    if (iErr) throw iErr;

    const full = await this.getById(ventaId);
    if (!full) throw new Error("No se pudo cargar la venta actualizada");
    return full;
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase.from(CAB).delete().eq("id", id);
    if (error) throw error;
  },

  async getResumenHoy(): Promise<{ totalVentas: number; cantidadVentas: number }> {
    const hoy = new Date().toISOString().split("T")[0];
    const { data: cabs, error } = await supabase.from(CAB).select("id").eq("fecha", hoy);
    if (error || !cabs?.length) return { totalVentas: 0, cantidadVentas: 0 };
    const ids = cabs.map((c: { id: string }) => c.id);
    const { data: lines, error: e2 } = await supabase.from(LIN).select("total").in("venta_id", ids);
    if (e2) return { totalVentas: 0, cantidadVentas: cabs.length };
    const totalVentas = (lines ?? []).reduce((s: number, r: { total: number }) => s + Number(r.total), 0);
    return { totalVentas, cantidadVentas: cabs.length };
  },

  async getResumenMes(year: number, month: number) {
    const ventas = await this.getVentasMes(year, month);
    const totalVentas = ventas.reduce((s, v) => s + totalVenta(v), 0);
    const cantidadVentas = ventas.length;
    const productosVendidos = ventas.reduce((s, v) => s + unidadesVenta(v), 0);
    return { totalVentas, cantidadVentas, productosVendidos };
  },
};
