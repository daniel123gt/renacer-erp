-- Corregir políticas de Storage para subida de imágenes de productos
-- (añade SELECT requerido y asegura que authenticated pueda operar)

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
