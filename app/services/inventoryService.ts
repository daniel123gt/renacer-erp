import supabase from "~/utils/supabase";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock" | "expired";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  salePrice: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  status: InventoryStatus;
  imageUrl?: string;
}

interface MaterialsRow {
  id: string;
  name: string;
  cost_soles: number;
  precio_venta?: number | null;
  is_active?: boolean;
  stock?: number | null;
  proveedor?: string | null;
  estado?: string | null;
  categoria?: string | null;
  description?: string | null;
  min_stock?: number | null;
  max_stock?: number | null;
  unit?: string | null;
  last_restocked?: string | null;
  expiry_date?: string | null;
  imagen_url?: string | null;
}

function computeStatus(
  current: number,
  min: number,
  stored?: string | null
): InventoryStatus {
  if (stored === "expired") return "expired";
  if (current === 0) return "out_of_stock";
  if (min > 0 && current <= min) return "low_stock";
  return (stored as InventoryStatus) || "in_stock";
}

function rowToItem(r: MaterialsRow): InventoryItem {
  const currentStock = Number(r.stock ?? 0);
  const minStock = Number(r.min_stock ?? 0);
  const status = computeStatus(
    currentStock,
    minStock,
    r.estado
  );
  return {
    id: r.id,
    name: r.name,
    category: r.categoria ?? "",
    description: r.description ?? "",
    currentStock,
    minStock,
    maxStock: Number(r.max_stock ?? 0),
    unit: r.unit ?? "unidades",
    price: Number(r.cost_soles ?? 0),
    salePrice: Number(r.precio_venta ?? 0),
    supplier: r.proveedor ?? "",
    lastRestocked: r.last_restocked
      ? String(r.last_restocked).slice(0, 10)
      : "",
    expiryDate: r.expiry_date ? String(r.expiry_date).slice(0, 10) : undefined,
    status,
    imageUrl: r.imagen_url ?? undefined,
  };
}

const MATERIALS_SELECT =
  "id, name, cost_soles, precio_venta, is_active, stock, proveedor, estado, categoria, description, min_stock, max_stock, unit, last_restocked, expiry_date, imagen_url";

/** Líneas de venta Renashop con vínculo a inventario (solo filas con producto_id ajustan stock). */
export type RenashopLineaStock = {
  producto_id: string | null;
  cantidad: number;
};

function aggregateQtyByProduct(lineas: RenashopLineaStock[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const { producto_id, cantidad } of lineas) {
    if (!producto_id) continue;
    const q = Number(cantidad);
    if (!Number.isFinite(q) || q <= 0) continue;
    m.set(producto_id, (m.get(producto_id) ?? 0) + q);
  }
  return m;
}

/**
 * Ajusta `materials.stock` según ventas Renashop:
 * - `releaseLineas`: unidades que vuelven al inventario (anular venta o edición).
 * - `consumeLineas`: unidades que salen del inventario (venta nueva o edición).
 * Por producto: stock_nuevo = stock_actual + sum(release) − sum(consume).
 */
export async function applyRenashopStockDelta(
  releaseLineas: RenashopLineaStock[],
  consumeLineas: RenashopLineaStock[]
): Promise<void> {
  const release = aggregateQtyByProduct(releaseLineas);
  const consume = aggregateQtyByProduct(consumeLineas);
  const allIds = new Set<string>([...release.keys(), ...consume.keys()]);
  if (allIds.size === 0) return;

  const { data: rows, error } = await supabase
    .from("materials")
    .select("id, name, stock, min_stock, estado")
    .in("id", [...allIds]);
  if (error) throw error;

  const byId = new Map<string, MaterialsRow>((rows ?? []).map((r: any) => [String(r.id), r as MaterialsRow]));

  const deltas = new Map<string, number>();
  for (const id of allIds) {
    const add = release.get(id) ?? 0;
    const sub = consume.get(id) ?? 0;
    deltas.set(id, add - sub);
  }

  for (const [id, delta] of deltas) {
    if (delta === 0) continue;
    const row = byId.get(id);
    if (!row) {
      throw new Error(`Producto no encontrado en inventario.`);
    }
    const current = Number(row.stock ?? 0);
    const minStock = Number(row.min_stock ?? 0);
    const next = current + delta;
    if (next < 0) {
      const name = (row as { name?: string }).name ?? id;
      const need = consume.get(id) ?? 0;
      const back = release.get(id) ?? 0;
      throw new Error(
        `Stock insuficiente para "${name}". Disponible: ${current}. ` +
          (need > back ? `Esta operación requiere ${need - back} unidades más.` : "")
      );
    }
    const estado = computeStatus(next, minStock, row.estado);
    const { error: uErr } = await supabase
      .from("materials")
      .update({ stock: next, estado })
      .eq("id", id);
    if (uErr) throw uErr;
  }
}

export interface ListInventoryResult {
  data: InventoryItem[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const inventoryService = {
  async list(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("materials")
      .select(MATERIALS_SELECT)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []).map((row) => rowToItem(row as MaterialsRow));
  },

  async listPaginated(options: {
    page: number;
    limit: number;
  }): Promise<ListInventoryResult> {
    const { page, limit } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("materials")
      .select(MATERIALS_SELECT, { count: "exact", head: false })
      .eq("is_active", true)
      .order("name")
      .range(from, to);
    if (error) throw error;
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: (data ?? []).map((row) => rowToItem(row as MaterialsRow)),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },

  async create(item: Omit<InventoryItem, "id">): Promise<InventoryItem> {
    const status =
      item.currentStock === 0
        ? "out_of_stock"
        : item.minStock > 0 && item.currentStock <= item.minStock
          ? "low_stock"
          : "in_stock";
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name: item.name.trim(),
        cost_soles: item.price,
        precio_venta: item.salePrice,
        is_active: true,
        stock: item.currentStock,
        proveedor: item.supplier?.trim() || null,
        estado: status,
        categoria: item.category?.trim() || null,
        description: item.description?.trim() || null,
        min_stock: item.minStock,
        max_stock: item.maxStock,
        unit: item.unit?.trim() || "unidades",
        last_restocked: item.lastRestocked?.trim() || null,
        expiry_date: item.expiryDate?.trim() || null,
        imagen_url: item.imageUrl?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToItem(data as MaterialsRow);
  },

  async update(item: InventoryItem): Promise<InventoryItem> {
    const status =
      item.currentStock === 0
        ? "out_of_stock"
        : item.minStock > 0 && item.currentStock <= item.minStock
          ? "low_stock"
          : item.status === "expired"
            ? "expired"
            : "in_stock";
    const { data, error } = await supabase
      .from("materials")
      .update({
        name: item.name.trim(),
        cost_soles: item.price,
        precio_venta: item.salePrice,
        stock: item.currentStock,
        proveedor: item.supplier?.trim() || null,
        estado: status,
        categoria: item.category?.trim() || null,
        description: item.description?.trim() || null,
        min_stock: item.minStock,
        max_stock: item.maxStock,
        unit: item.unit?.trim() || "unidades",
        last_restocked: item.lastRestocked?.trim() || null,
        expiry_date: item.expiryDate?.trim() || null,
        imagen_url: item.imageUrl?.trim() || null,
      })
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    return rowToItem(data as MaterialsRow);
  },
};
