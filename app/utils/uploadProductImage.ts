import supabase from "~/utils/supabase";

const BUCKET = "productos";

export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = productId
    ? `${productId}/${Date.now()}.${ext}`
    : `temp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    const path = url.split("/productos/")[1]?.split("?")[0];
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  } catch {
    // Ignorar errores al eliminar
  }
}
