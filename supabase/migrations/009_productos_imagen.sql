-- ============================================
-- Imagen de producto en inventario
-- ============================================

ALTER TABLE materials ADD COLUMN IF NOT EXISTS imagen_url text;

-- Bucket de Supabase Storage para fotos de productos (público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas: usuarios autenticados pueden subir, leer, actualizar y eliminar
DROP POLICY IF EXISTS "productos_select" ON storage.objects;
DROP POLICY IF EXISTS "productos_upload" ON storage.objects;
DROP POLICY IF EXISTS "productos_update" ON storage.objects;
DROP POLICY IF EXISTS "productos_delete" ON storage.objects;

CREATE POLICY "productos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'productos');

CREATE POLICY "productos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos');

CREATE POLICY "productos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'productos');

CREATE POLICY "productos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'productos');
