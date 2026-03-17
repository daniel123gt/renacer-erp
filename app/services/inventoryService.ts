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
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  status: InventoryStatus;
}

interface MaterialsRow {
  id: string;
  name: string;
  cost_soles: number;
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
    supplier: r.proveedor ?? "",
    lastRestocked: r.last_restocked
      ? String(r.last_restocked).slice(0, 10)
      : "",
    expiryDate: r.expiry_date ? String(r.expiry_date).slice(0, 10) : undefined,
    status,
  };
}

const MATERIALS_SELECT =
  "id, name, cost_soles, is_active, stock, proveedor, estado, categoria, description, min_stock, max_stock, unit, last_restocked, expiry_date";

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
      })
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    return rowToItem(data as MaterialsRow);
  },
};
